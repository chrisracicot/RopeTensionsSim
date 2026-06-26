using UnityEngine;

public class RopeInteractor : MonoBehaviour
{
    [Header("Layer Settings")]
    [SerializeField] private LayerMask ropeLayer;

    [Header("Interaction Settings")]
    [SerializeField] private float maxPullDistance = 5f;
    [SerializeField] private float jointFrequency = 15f;
    [SerializeField] private float jointDamping = 1f;
    [SerializeField] private float jointMaxForce = 10000f;

    [Header("Visual Settings")]
    [SerializeField] private Color dragLineColor = new Color(0f, 1f, 1f, 0.5f);
    [SerializeField] private float dragLineWidth = 0.05f;

    private Camera mainCamera;
    private Rigidbody2D draggedBody;
    private TargetJoint2D targetJoint;
    private Vector2 initialGrabPoint;
    private LineRenderer dragLineRenderer;

    private void Awake()
    {
        mainCamera = Camera.main;
        
        // Set up the line renderer for drag feedback
        dragLineRenderer = gameObject.AddComponent<LineRenderer>();
        dragLineRenderer.startWidth = dragLineWidth;
        dragLineRenderer.endWidth = dragLineWidth;
        dragLineRenderer.positionCount = 0;
        dragLineRenderer.useWorldSpace = true;
        
        // Create a simple semi-transparent material for the line
        Shader spriteShader = Shader.Find("Sprites/Default");
        if (spriteShader != null)
        {
            dragLineRenderer.material = new Material(spriteShader);
        }
        dragLineRenderer.startColor = dragLineColor;
        dragLineRenderer.endColor = dragLineColor;
    }

    private void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            TryStartDrag();
        }
        else if (Input.GetMouseButton(0) && draggedBody != null)
        {
            UpdateDrag();
        }
        else if (Input.GetMouseButtonUp(0) && draggedBody != null)
        {
            StopDrag();
        }
    }

    private void TryStartDrag()
    {
        Vector2 mouseWorldPos = mainCamera.ScreenToWorldPoint(Input.mousePosition);
        RaycastHit2D hit = Physics2D.Raycast(mouseWorldPos, Vector2.zero, Mathf.Infinity, ropeLayer);

        if (hit.collider != null)
        {
            draggedBody = hit.collider.GetComponent<Rigidbody2D>();
            if (draggedBody != null)
            {
                initialGrabPoint = hit.point;
                
                targetJoint = draggedBody.gameObject.AddComponent<TargetJoint2D>();
                targetJoint.anchor = draggedBody.transform.InverseTransformPoint(initialGrabPoint);
                targetJoint.target = initialGrabPoint;
                targetJoint.maxForce = jointMaxForce;
                targetJoint.frequency = jointFrequency;
                targetJoint.dampingRatio = jointDamping;

                dragLineRenderer.positionCount = 2;
                dragLineRenderer.SetPosition(0, initialGrabPoint);
                dragLineRenderer.SetPosition(1, initialGrabPoint);
            }
        }
    }

    private void UpdateDrag()
    {
        Vector2 mouseWorldPos = mainCamera.ScreenToWorldPoint(Input.mousePosition);
        Vector2 dragVector = mouseWorldPos - initialGrabPoint;

        if (dragVector.magnitude > maxPullDistance)
        {
            dragVector = dragVector.normalized * maxPullDistance;
        }

        Vector2 targetPos = initialGrabPoint + dragVector;
        if (targetJoint != null)
        {
            targetJoint.target = targetPos;
        }

        if (draggedBody != null)
        {
            Vector2 currentGrabWorldPos = draggedBody.transform.TransformPoint(targetJoint.anchor);
            dragLineRenderer.SetPosition(0, currentGrabWorldPos);
            dragLineRenderer.SetPosition(1, targetPos);
            
            // Dynamic tension color-shifting (blue/cyan for relaxed to red for full pull)
            float tensionRatio = dragVector.magnitude / maxPullDistance;
            Color currentColor = Color.Lerp(new Color(0f, 0.8f, 1f, 0.6f), new Color(1f, 0.2f, 0.2f, 0.8f), tensionRatio);
            dragLineRenderer.startColor = currentColor;
            dragLineRenderer.endColor = currentColor;
        }
    }

    private void StopDrag()
    {
        if (targetJoint != null)
        {
            Destroy(targetJoint);
        }
        draggedBody = null;
        dragLineRenderer.positionCount = 0;
    }
}
