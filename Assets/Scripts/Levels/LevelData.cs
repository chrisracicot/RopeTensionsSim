using UnityEngine;
using System;

[CreateAssetMenu(fileName = "NewLevel", menuName = "RopeSwing/Level Data")]
public class LevelData : ScriptableObject
{
    public Vector2 ballSpawnPosition;
    public RopeDefinition[] ropes;
    public ObstacleDefinition[] obstacles;
}

[Serializable]
public struct RopeDefinition
{
    public Vector2 startAnchor;
    public Vector2 endAnchor;
}

[Serializable]
public struct ObstacleDefinition
{
    public Vector2 position;
    public Vector3 scale;
    public float rotationZ;
    public GameObject prefab;
}
