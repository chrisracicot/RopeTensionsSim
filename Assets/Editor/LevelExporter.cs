using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

public class LevelExporter : EditorWindow
{
    [MenuItem("Tools/Export Sandbox Level")]
    public static void ExportLevel()
    {
        SandboxBall ballMarker = FindAnyObjectByType<SandboxBall>();
        if (ballMarker == null)
        {
            Debug.LogError("No SandboxBall found in the scene! Cannot export level.");
            return;
        }

        SandboxRope[] ropeMarkers = FindObjectsByType<SandboxRope>();
        SandboxObstacle[] obstacleMarkers = FindObjectsByType<SandboxObstacle>();

        LevelData newLevel = ScriptableObject.CreateInstance<LevelData>();
        
        newLevel.ballSpawnPosition = ballMarker.transform.position;
        
        newLevel.ropes = new RopeDefinition[ropeMarkers.Length];
        for (int i = 0; i < ropeMarkers.Length; i++)
        {
            newLevel.ropes[i] = new RopeDefinition
            {
                startAnchor = ropeMarkers[i].startAnchor != null ? (Vector2)ropeMarkers[i].startAnchor.position : Vector2.zero,
                endAnchor = ropeMarkers[i].endAnchor != null ? (Vector2)ropeMarkers[i].endAnchor.position : Vector2.zero
            };
        }

        newLevel.obstacles = new ObstacleDefinition[obstacleMarkers.Length];
        for (int i = 0; i < obstacleMarkers.Length; i++)
        {
            newLevel.obstacles[i] = new ObstacleDefinition
            {
                position = obstacleMarkers[i].transform.position,
                scale = obstacleMarkers[i].transform.localScale,
                rotationZ = obstacleMarkers[i].transform.eulerAngles.z,
                prefab = obstacleMarkers[i].actualPrefab
            };
        }

        string defaultName = "NewLevel";
        string path = EditorUtility.SaveFilePanelInProject("Save Level Data", defaultName, "asset", "Save level data as an asset file");
        
        if (string.IsNullOrEmpty(path))
        {
            Debug.Log("Export cancelled.");
            return;
        }

        AssetDatabase.CreateAsset(newLevel, path);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        
        Debug.Log($"Level successfully exported to {path}!");
        EditorUtility.FocusProjectWindow();
        Selection.activeObject = newLevel;
    }
}
