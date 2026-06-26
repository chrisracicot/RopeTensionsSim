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
        
        // Configure Main Camera for a 2D viewport
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.transform.position = new Vector3(0, 0, -15);
            mainCam.orthographic = true;
            mainCam.orthographicSize = 10f;
            mainCam.backgroundColor = new Color(0.15f, 0.15f, 0.15f); // Sleek dark gray background
            mainCam.clearFlags = CameraClearFlags.SolidColor;
        }

        // 2. Create Anchors
        GameObject anchorLeft = CreateAnchor("AnchorLeft", new Vector2(-6, -2));
        GameObject anchorRight = CreateAnchor("AnchorRight", new Vector2(6, -2));

        // 3. Create Rope Generator
        GameObject ropeObj = new GameObject("PhysicalRope");
        var ropeBuilder = ropeObj.AddComponent<RopeBuilder>();
        ropeBuilder.startAnchor = anchorLeft.transform;
        ropeBuilder.endAnchor = anchorRight.transform;

        // Configure some default elastic settings on the RopeBuilder
        SerializedObject soRope = new SerializedObject(ropeBuilder);
        soRope.FindProperty("segmentCount").intValue = 30; // More segments for a smoother rope
        soRope.FindProperty("segmentMass").floatValue = 0.5f;
        soRope.FindProperty("springFrequency").floatValue = 20f; // Stiffer springs to prevent extreme stretching
        soRope.FindProperty("dampingRatio").floatValue = 0.5f;
        soRope.ApplyModifiedProperties();

        // 4. Create Player (The Ball)
        GameObject player = new GameObject("Player");
        player.transform.position = new Vector3(0, 8, 0); // High up so it drops hard

        var playerSprite = player.AddComponent<SpriteRenderer>();
        playerSprite.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
        playerSprite.color = Color.cyan;
        player.transform.localScale = new Vector3(2, 2, 1); // Make it a bit bigger

        var rb = player.AddComponent<Rigidbody2D>();
        rb.mass = 2f; // Reduced mass from 5f to 2f for better stability against the 0.5f mass rope segments
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

        player.AddComponent<CircleCollider2D>();
        player.AddComponent<PlayerController>(); // Simplified script

        // Save the scene
        EditorSceneManager.SaveScene(newScene, "Assets/Scenes/RopeSwingTest.unity");
        Debug.Log("Trampoline Rope Test Scene created successfully at Assets/Scenes/RopeSwingTest.unity!");
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
