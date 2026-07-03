using UnityEngine;

public class LevelLoader : MonoBehaviour
{
    [Header("Level Settings")]
    public LevelData levelToLoad;

    [Header("Prefabs")]
    public GameObject playerPrefab;
    public GameObject anchorPrefab;
    
    [Tooltip("A prefab containing the RopeBuilder component")]
    public GameObject ropeBuilderPrefab;

    [Header("Global Settings")]
    public GameSettings gameSettings;

    private void Awake()
    {
        if (gameSettings != null)
        {
            Physics2D.gravity = gameSettings.globalGravity;
            Time.fixedDeltaTime = gameSettings.fixedDeltaTime;
            Physics2D.velocityIterations = gameSettings.velocityIterations;
            Physics2D.positionIterations = gameSettings.positionIterations;
        }
    }

    private void Start()
    {
        if (levelToLoad != null)
        {
            LoadLevel(levelToLoad);
        }
    }

    public void LoadLevel(LevelData data)
    {
        // 1. Clear old level (find and destroy all objects tagged or marked, or simply clear children if they are parented to this manager)
        foreach (Transform child in transform)
        {
            Destroy(child.gameObject);
        }

        // 2. Spawn Ball
        if (playerPrefab != null)
        {
            GameObject player = Instantiate(playerPrefab, data.ballSpawnPosition, Quaternion.identity, transform);
            player.name = "Player";
        }
        else
        {
            Debug.LogError("Player Prefab is missing in LevelLoader.");
        }

        // 3. Spawn Obstacles
        foreach (var obs in data.obstacles)
        {
            if (obs.prefab != null)
            {
                GameObject instantiatedObs = Instantiate(obs.prefab, obs.position, Quaternion.Euler(0, 0, obs.rotationZ), transform);
                instantiatedObs.transform.localScale = obs.scale;
            }
        }

        // 4. Spawn Ropes
        for (int i = 0; i < data.ropes.Length; i++)
        {
            var ropeData = data.ropes[i];

            GameObject leftAnchor = Instantiate(anchorPrefab, ropeData.startAnchor, Quaternion.identity, transform);
            leftAnchor.name = $"Anchor_{i}_Start";

            GameObject rightAnchor = Instantiate(anchorPrefab, ropeData.endAnchor, Quaternion.identity, transform);
            rightAnchor.name = $"Anchor_{i}_End";

            if (ropeBuilderPrefab != null)
            {
                GameObject ropeObj = Instantiate(ropeBuilderPrefab, Vector3.zero, Quaternion.identity, transform);
                ropeObj.name = $"PhysicalRope_{i}";
                
                RopeBuilder builder = ropeObj.GetComponent<RopeBuilder>();
                if (builder != null)
                {
                    builder.startAnchor = leftAnchor.transform;
                    builder.endAnchor = rightAnchor.transform;
                }
            }
        }
    }
}
