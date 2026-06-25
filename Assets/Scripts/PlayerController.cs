using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float moveSpeed = 8f;
    [SerializeField] private float airControlForce = 15f;
    [SerializeField] private float jumpForce = 10f;

    [Header("Ground Check")]
    [SerializeField] private Transform groundCheck;
    [SerializeField] private float groundCheckRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;

    private Rigidbody2D rb;
    private RopeSystem ropeSystem;
    private float horizontalInput;
    private bool isGrounded;
    private bool jumpRequested;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        ropeSystem = GetComponent<RopeSystem>();
    }

    private void Update()
    {
        horizontalInput = Input.GetAxisRaw("Horizontal");

        // Jump / Release Rope
        if (Input.GetButtonDown("Jump"))
        {
            jumpRequested = true;
        }
    }

    private void FixedUpdate()
    {
        CheckGroundStatus();
        HandleMovement();
        HandleJump();
    }

    private void CheckGroundStatus()
    {
        isGrounded = false;
        if (groundCheck != null)
        {
            Collider2D[] colliders = Physics2D.OverlapCircleAll(groundCheck.position, groundCheckRadius, groundLayer);
            if (colliders.Length > 0)
            {
                isGrounded = true;
            }
        }
    }

    private void HandleMovement()
    {
        bool isSwinging = ropeSystem != null && ropeSystem.IsConnected;

        if (isSwinging)
        {
            // Apply swing air control force
            if (Mathf.Abs(horizontalInput) > 0.1f)
            {
                rb.AddForce(new Vector2(horizontalInput * airControlForce, 0f));
            }
        }
        else
        {
            // Normal ground/air movement
            float targetVelocityX = horizontalInput * moveSpeed;
            float velocityChangeX = targetVelocityX - rb.linearVelocity.x;
            
            // Apply direct force to match desired velocity
            rb.AddForce(new Vector2(velocityChangeX * rb.mass * 10f, 0f));
        }
    }

    private void HandleJump()
    {
        if (jumpRequested)
        {
            jumpRequested = false;

            if (ropeSystem != null && ropeSystem.IsConnected)
            {
                // If swinging, disconnect first and apply a small boost
                ropeSystem.Disconnect();
                rb.AddForce(Vector2.up * jumpForce * 0.75f, ForceMode2D.Impulse);
            }
            else if (isGrounded)
            {
                // Normal jump
                rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
            }
        }
    }

    private void OnDrawGizmosSelected()
    {
        if (groundCheck != null)
        {
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
        }
    }
}
