using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;

public class CreateSandboxScene : EditorWindow
{
    [MenuItem("Tools/Create Sandbox Level Editor Scene")]
    public static void CreateScene()
    {
        Scene newScene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
        
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.transform.position = new Vector3(0, 0, -15);
            mainCam.orthographic = true;
            mainCam.orthographicSize = 10f;
            mainCam.backgroundColor = new Color(0.15f, 0.15f, 0.15f);
            mainCam.clearFlags = CameraClearFlags.SolidColor;
        }

        // Helper for default sprite
        Sprite defaultSprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");

        // Sandbox Ball
        GameObject ball = new GameObject("Sandbox_Ball");
        ball.transform.position = new Vector3(0, 5, 0);
        ball.transform.localScale = new Vector3(4, 4, 1);
        ball.AddComponent<SandboxBall>();
        var ballRenderer = ball.AddComponent<SpriteRenderer>();
        ballRenderer.sprite = defaultSprite;
        ballRenderer.color = Color.green;

        // Sandbox Rope
        GameObject rope = new GameObject("Sandbox_Rope");
        rope.AddComponent<SandboxRope>();
        
        GameObject leftAnchor = new GameObject("Sandbox_AnchorLeft");
        leftAnchor.transform.position = new Vector2(-5, 0);
        leftAnchor.transform.SetParent(rope.transform);
        var leftRenderer = leftAnchor.AddComponent<SpriteRenderer>();
        leftRenderer.sprite = defaultSprite;
        leftRenderer.color = Color.red;
        
        GameObject rightAnchor = new GameObject("Sandbox_AnchorRight");
        rightAnchor.transform.position = new Vector2(5, 0);
        rightAnchor.transform.SetParent(rope.transform);
        var rightRenderer = rightAnchor.AddComponent<SpriteRenderer>();
        rightRenderer.sprite = defaultSprite;
        rightRenderer.color = Color.red;
        
        rope.GetComponent<SandboxRope>().startAnchor = leftAnchor.transform;
        rope.GetComponent<SandboxRope>().endAnchor = rightAnchor.transform;

        // Sample Sandbox Obstacle
        GameObject obstacle = new GameObject("Sandbox_Obstacle (Duplicate Me!)");
        obstacle.transform.position = new Vector2(0, -3);
        obstacle.transform.localScale = new Vector3(3, 1, 1);
        obstacle.AddComponent<SandboxObstacle>();
        var obsRenderer = obstacle.AddComponent<SpriteRenderer>();
        obsRenderer.sprite = defaultSprite;
        obsRenderer.color = Color.yellow;

        EditorSceneManager.SaveScene(newScene, "Assets/Scenes/SandboxLevelEditor.unity");
        Debug.Log("Sandbox Scene created! Move the ball and anchors around, then click Tools > Export Sandbox Level.");
    }
}
