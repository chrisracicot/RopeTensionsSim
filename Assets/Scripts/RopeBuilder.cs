using UnityEngine;
using System.Collections.Generic;

[RequireComponent(typeof(LineRenderer))]
public class RopeBuilder : MonoBehaviour
{
    [Header("Anchors")]
    public Transform startAnchor;
    public Transform endAnchor;

    [Header("Rope Settings")]
    [SerializeField] private int segmentCount = 10;
    [SerializeField] private float segmentMass = 0.2f;
    [SerializeField] private float ropeWidth = 0.2f;
    [SerializeField] private Color ropeColor = Color.white;

    [Header("Physics Settings")]
    [SerializeField] private float springFrequency = 10f;
    [SerializeField] private float dampingRatio = 0.5f;
    [SerializeField] private float linearDrag = 1f;
    [SerializeField] private float angularDrag = 1f;

    private LineRenderer lineRenderer;
    private List<Transform> ropeNodes = new List<Transform>();

    private void Start()
    {
        lineRenderer = GetComponent<LineRenderer>();
        lineRenderer.startWidth = ropeWidth;
        lineRenderer.endWidth = ropeWidth;
        lineRenderer.startColor = ropeColor;
        lineRenderer.endColor = ropeColor;
        lineRenderer.useWorldSpace = true;
        
        Shader spriteShader = Shader.Find("Sprites/Default");
        if (spriteShader != null)
        {
            lineRenderer.material = new Material(spriteShader);
        }

        Physics2D.IgnoreLayerCollision(gameObject.layer, gameObject.layer, true);

        BuildRope();
    }

    private void BuildRope()
    {
        if (startAnchor == null || endAnchor == null)
        {
            Debug.LogError("RopeBuilder needs both Start and End anchors assigned!");
            return;
        }

        ropeNodes.Clear();
        ropeNodes.Add(startAnchor);

        Vector2 startPos = startAnchor.position;
        Vector2 endPos = endAnchor.position;
        Vector2 direction = (endPos - startPos).normalized;
        float totalDistance = Vector2.Distance(startPos, endPos);
        float stepDistance = totalDistance / (segmentCount + 1);

        Rigidbody2D previousRb = startAnchor.GetComponent<Rigidbody2D>();
        
        // Ensure start anchor has a kinematic rigidbody so joints can attach
        if (previousRb == null)
        {
            previousRb = startAnchor.gameObject.AddComponent<Rigidbody2D>();
            previousRb.bodyType = RigidbodyType2D.Kinematic;
        }

        for (int i = 0; i < segmentCount; i++)
        {
            Vector2 spawnPos = startPos + direction * (stepDistance * (i + 1));
            GameObject segment = new GameObject($"RopeSegment_{i}");
            segment.transform.position = spawnPos;
            segment.transform.SetParent(transform);
            segment.layer = gameObject.layer;

            segment.transform.right = direction; // Orient segment to face the next one

            Rigidbody2D rb = segment.AddComponent<Rigidbody2D>();
            rb.mass = segmentMass;
            rb.linearDamping = linearDrag;
            rb.angularDamping = angularDrag;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            CapsuleCollider2D col = segment.AddComponent<CapsuleCollider2D>();
            col.direction = CapsuleDirection2D.Horizontal;
            // Make the capsule slightly longer than the step distance so they overlap and leave no gaps
            col.size = new Vector2(stepDistance * 1.5f, ropeWidth);

            SpringJoint2D joint = segment.AddComponent<SpringJoint2D>();
            joint.connectedBody = previousRb;
            joint.autoConfigureDistance = false;
            joint.distance = stepDistance * 0.9f; // Pre-tensioned by 10% to increase sag by 10%
            joint.frequency = springFrequency;
            joint.dampingRatio = dampingRatio;
            joint.enableCollision = false; // segments don't collide with their immediate neighbors

            ropeNodes.Add(segment.transform);
            previousRb = rb;
        }

        // Attach last segment to end anchor
        Rigidbody2D endRb = endAnchor.GetComponent<Rigidbody2D>();
        if (endRb == null)
        {
            endRb = endAnchor.gameObject.AddComponent<Rigidbody2D>();
            endRb.bodyType = RigidbodyType2D.Kinematic;
        }

        SpringJoint2D lastJoint = endAnchor.gameObject.AddComponent<SpringJoint2D>();
        lastJoint.connectedBody = previousRb;
        lastJoint.autoConfigureDistance = false;
        lastJoint.distance = stepDistance * 0.9f; // Pre-tensioned by 10% to increase sag by 10%
        lastJoint.frequency = springFrequency;
        lastJoint.dampingRatio = dampingRatio;
        lastJoint.enableCollision = false;

        ropeNodes.Add(endAnchor);
    }

    private void Update()
    {
        if (ropeNodes.Count == 0) return;

        lineRenderer.positionCount = ropeNodes.Count;
        for (int i = 0; i < ropeNodes.Count; i++)
        {
            if (ropeNodes[i] != null)
            {
                lineRenderer.SetPosition(i, ropeNodes[i].position);
            }
        }
    }
}
