using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using System.IO;

public class CreateTestScene : EditorWindow
{
    [MenuItem("Tools/Create Rope Swing Test Scene")]
    public static void CreateScene()
    {
        // Ensure Scenes directory exists
        string scenesDirPath = Application.dataPath + "/Scenes";
        if (!Directory.Exists(scenesDirPath))
        {
            Directory.CreateDirectory(scenesDirPath);
            AssetDatabase.Refresh();
        }

        // 1. Create a new active scene
        Scene newScene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
        
        // Push physics iterations and update rate to maximum safe limits
        Physics2D.velocityIterations = 50;
        Physics2D.positionIterations = 50;
        Time.fixedDeltaTime = 0.005f; // 200Hz fixed update for extreme spring stability

        // Ensure Rope layer exists and get its index
        int ropeLayerIndex = AddLayer("Rope");

        // Configure Main Camera for a 2D viewport
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.transform.position = new Vector3(0, 0, -15);
            mainCam.orthographic = true;
            mainCam.orthographicSize = 10f;
            mainCam.backgroundColor = new Color(0.15f, 0.15f, 0.15f); // Sleek dark gray background
            mainCam.clearFlags = CameraClearFlags.SolidColor;

            // Attach RopeInteractor and assign rope layer mask
            var interactor = mainCam.gameObject.AddComponent<RopeInteractor>();
            if (ropeLayerIndex != -1)
            {
                SerializedObject soInteractor = new SerializedObject(interactor);
                soInteractor.FindProperty("ropeLayer").intValue = 1 << ropeLayerIndex;
                soInteractor.ApplyModifiedProperties();
            }
        }

        // 2. Create Anchors
        GameObject anchorLeft = CreateAnchor("AnchorLeft", new Vector2(-6, -2));
        GameObject anchorRight = CreateAnchor("AnchorRight", new Vector2(6, -2));

        // 3. Create Rope Generator
        GameObject ropeObj = new GameObject("PhysicalRope");
        if (ropeLayerIndex != -1)
        {
            ropeObj.layer = ropeLayerIndex;
        }

        var ropeBuilder = ropeObj.AddComponent<RopeBuilder>();
        ropeBuilder.startAnchor = anchorLeft.transform;
        ropeBuilder.endAnchor = anchorRight.transform;

        // Configure some default elastic settings on the RopeBuilder
        SerializedObject soRope = new SerializedObject(ropeBuilder);
        soRope.FindProperty("segmentCount").intValue = 30; // More segments for a smoother rope
        soRope.FindProperty("segmentMass").floatValue = 0.1f; // Lighter segments to reduce sag
        soRope.FindProperty("springFrequency").floatValue = 30f; // Tuned spring frequency to avoid Nyquist limits and reduce jitter
        soRope.FindProperty("dampingRatio").floatValue = 1.0f; // Critically damp the springs to kill all jitter
        soRope.FindProperty("linearDrag").floatValue = 2.25f; // Increased by 50% (was 1.5f)
        soRope.FindProperty("angularDrag").floatValue = 2.25f; // Increased by 50% (was 1.5f)
        soRope.ApplyModifiedProperties();

        // 4. Create Player (The Ball)
        GameObject player = new GameObject("Player");
        player.transform.position = new Vector3(0, 8, 0); // High up so it drops hard

        var playerSprite = player.AddComponent<SpriteRenderer>();
        playerSprite.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
        playerSprite.color = Color.cyan;
        player.transform.localScale = new Vector3(12f, 12f, 1f); // Increased by 500% relative to baseline size of (2, 2, 1)

        var rb = player.AddComponent<Rigidbody2D>();
        rb.mass = 2f; // Reduced mass from 5f to 2f for better stability against the 0.5f mass rope segments
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

        player.AddComponent<CircleCollider2D>();
        player.AddComponent<PlayerController>(); // Simplified script

        // Save the scene
        EditorSceneManager.SaveScene(newScene, "Assets/Scenes/RopeSwingTest.unity");
        Debug.Log("Trampoline Rope Test Scene created successfully at Assets/Scenes/RopeSwingTest.unity!");
    }

    private static int AddLayer(string layerName)
    {
        var assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
        if (assets == null || assets.Length == 0)
        {
            Debug.LogError("Could not load TagManager.asset");
            return -1;
        }

        SerializedObject tagManager = new SerializedObject(assets[0]);
        SerializedProperty layers = tagManager.FindProperty("layers");

        if (layers == null || !layers.isArray)
        {
            Debug.LogError("TagManager layers property not found or not an array");
            return -1;
        }

        // Check if layer already exists
        for (int i = 8; i < layers.arraySize; i++)
        {
            SerializedProperty sp = layers.GetArrayElementAtIndex(i);
            if (sp != null && sp.stringValue == layerName)
            {
                return i;
            }
        }

        // Try to find an empty slot
        for (int i = 8; i < layers.arraySize; i++)
        {
            SerializedProperty sp = layers.GetArrayElementAtIndex(i);
            if (sp != null && string.IsNullOrEmpty(sp.stringValue))
            {
                sp.stringValue = layerName;
                tagManager.ApplyModifiedProperties();
                return i;
            }
        }

        Debug.LogError($"Could not add layer '{layerName}' because all user layer slots (8-31) are full!");
        return -1;
    }

    private static GameObject CreateAnchor(string name, Vector2 pos)
    {
        GameObject anchor = new GameObject(name);
        anchor.transform.position = pos;

        var anchorSprite = anchor.AddComponent<SpriteRenderer>();
        anchorSprite.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
        anchorSprite.color = Color.red;

        var rb = anchor.AddComponent<Rigidbody2D>();
        rb.bodyType = RigidbodyType2D.Kinematic;

        return anchor;
    }
}
