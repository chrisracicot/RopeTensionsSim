using UnityEngine;

[CreateAssetMenu(fileName = "GameSettings", menuName = "RopeSwing/Game Settings")]
public class GameSettings : ScriptableObject
{
    [Header("Physics Settings")]
    [Tooltip("The global gravity applied to 2D physics.")]
    public Vector2 globalGravity = new Vector2(0f, -12.753f);
    
    [Tooltip("The fixed physics update step. E.g., 0.005s = 200Hz.")]
    public float fixedDeltaTime = 0.005f;
    
    [Tooltip("The number of velocity update iterations for the physics solver.")]
    [Range(1, 100)]
    public int velocityIterations = 50;
    
    [Tooltip("The number of position update iterations for the physics solver.")]
    [Range(1, 100)]
    public int positionIterations = 50;

    [Header("Rope Interaction Settings")]
    [Tooltip("The maximum distance the user can pull/stretch the rope.")]
    public float maxPullDistance = 5f;
    
    [Tooltip("The radius of the overlap test used to grab the rope.")]
    public float grabRadius = 2f;
    
    [Tooltip("The spring frequency of the grab joint.")]
    public float grabJointFrequency = 15f;
    
    [Tooltip("The damping ratio of the grab joint.")]
    public float grabJointDamping = 1f;
    
    [Tooltip("The maximum force exerted by the pulling joint.")]
    public float grabJointMaxForce = 50000f;
}
