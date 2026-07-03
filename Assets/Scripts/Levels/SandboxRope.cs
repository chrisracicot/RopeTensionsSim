using UnityEngine;

[ExecuteAlways]
[RequireComponent(typeof(LineRenderer))]
public class SandboxRope : MonoBehaviour
{
    [Tooltip("The starting anchor position")]
    public Transform startAnchor;
    
    [Tooltip("The ending anchor position")]
    public Transform endAnchor;

    private LineRenderer lineRenderer;

    private void Awake()
    {
        lineRenderer = GetComponent<LineRenderer>();
        lineRenderer.startWidth = 0.2f;
        lineRenderer.endWidth = 0.2f;
        lineRenderer.useWorldSpace = true;
        
        Shader spriteShader = Shader.Find("Sprites/Default");
        if (spriteShader != null)
        {
            lineRenderer.material = new Material(spriteShader);
        }
        lineRenderer.startColor = Color.cyan;
        lineRenderer.endColor = Color.cyan;
    }

    private void Update()
    {
        if (startAnchor != null && endAnchor != null)
        {
            lineRenderer.positionCount = 2;
            lineRenderer.SetPosition(0, startAnchor.position);
            lineRenderer.SetPosition(1, endAnchor.position);
        }
        else
        {
            lineRenderer.positionCount = 0;
        }
    }

    private void OnDrawGizmos()
    {
        if (startAnchor != null && endAnchor != null)
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawSphere(startAnchor.position, 0.2f);
            Gizmos.DrawSphere(endAnchor.position, 0.2f);
        }
    }
}
