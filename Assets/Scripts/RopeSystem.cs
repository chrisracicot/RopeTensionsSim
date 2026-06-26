using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(LineRenderer))]
public class RopeSystem : MonoBehaviour
{
    [Header("Rope Settings")]
    [SerializeField] private float maxRopeLength = 10f;
    [SerializeField] private LayerMask anchorLayer;
    
    [Header("Elastic Settings")]
    [SerializeField] private float springFrequency = 2.0f;
    [SerializeField] private float dampingRatio = 0.5f;
    [SerializeField] private float tensionMultiplier = 0.5f;
    
    [Header("Visual Settings")]
    [SerializeField] private Color ropeColor = Color.white;
    [SerializeField] private float ropeWidth = 0.1f;

    private Rigidbody2D rb;
    private SpringJoint2D joint;
    private LineRenderer lineRenderer;
    private Vector2 ropeAttachedPosition;
    private bool isConnected;

    public bool IsConnected => isConnected;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        lineRenderer = GetComponent<LineRenderer>();

        // Configure LineRenderer
        lineRenderer.startWidth = ropeWidth;
        lineRenderer.endWidth = ropeWidth;
        lineRenderer.startColor = ropeColor;
        lineRenderer.endColor = ropeColor;
        lineRenderer.positionCount = 0;

        // Try to get or add SpringJoint2D
        joint = GetComponent<SpringJoint2D>();
        if (joint == null)
        {
            joint = gameObject.AddComponent<SpringJoint2D>();
        }
        joint.enabled = false;
    }

    private void Update()
    {
        // Right/Left click to shoot rope
        if (Input.GetMouseButtonDown(0))
        {
            if (isConnected)
            {
                Disconnect();
            }
            else
            {
                TryConnectRope();
            }
        }

        // Draw the rope visually
        if (isConnected)
        {
            DrawRope();
        }
    }

    private void TryConnectRope()
    {
        Vector2 mouseWorldPos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
        
        // Find nearest anchor on the anchorLayer
        Collider2D[] anchors = Physics2D.OverlapCircleAll(mouseWorldPos, 1.5f, anchorLayer);
        
        Collider2D targetAnchor = null;
        float minDistance = float.MaxValue;

        foreach (var anchor in anchors)
        {
            float dist = Vector2.Distance(mouseWorldPos, anchor.transform.position);
            if (dist < minDistance)
            {
                minDistance = dist;
                targetAnchor = anchor;
            }
        }

        if (targetAnchor != null)
        {
            float distToPlayer = Vector2.Distance(transform.position, targetAnchor.transform.position);
            if (distToPlayer <= maxRopeLength)
            {
                ConnectToAnchor(targetAnchor);
            }
        }
    }

    private void ConnectToAnchor(Collider2D anchorCollider)
    {
        isConnected = true;
        ropeAttachedPosition = anchorCollider.transform.position;

        joint.enabled = true;
        joint.connectedAnchor = ropeAttachedPosition;
        
        float actualDistance = Vector2.Distance(transform.position, ropeAttachedPosition);
        joint.distance = actualDistance * tensionMultiplier;
        joint.frequency = springFrequency;
        joint.dampingRatio = dampingRatio;
        
        // Match joint properties to desired responsiveness
        joint.enableCollision = true;

        lineRenderer.positionCount = 2;
    }

    public void Disconnect()
    {
        isConnected = false;
        joint.enabled = false;
        lineRenderer.positionCount = 0;
    }

    private void DrawRope()
    {
        if (lineRenderer.positionCount == 2)
        {
            lineRenderer.SetPosition(0, transform.position);
            lineRenderer.SetPosition(1, ropeAttachedPosition);
        }
    }
}
