/**
 * Source code for PlayerRunner.cs and Unity Inspector configuration specifications.
 */

export const PLAYER_RUNNER_CS_CODE = `using System.Collections;
using UnityEngine;

/// <summary>
/// Controlador principal del jugador para juego 2D Auto-Runner móvil.
/// Incluye cancelación de estados (Animation Canceling) y soporte Táctil.
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(CapsuleCollider2D))]
[RequireComponent(typeof(Animator))]
public class PlayerRunner : MonoBehaviour
{
    [Header("--- FÍSICAS DE SALTO & GAME FEEL ---")]
    [SerializeField] private float jumpForce = 18f;
    [SerializeField] private float fallMultiplier = 2.5f;
    [SerializeField] private float fastFallForce = 22f;
    [SerializeField] private float groundCheckRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;
    [SerializeField] private Vector2 groundCheckOffset = new Vector2(0f, 0.05f);

    [Header("--- MECÁNICA DE DESLIZAMIENTO ---")]
    [SerializeField] private float slideDuration = 0.4f;

    [Header("--- REFERENCIAS & ESTADO ---")]
    [SerializeField] private bool showGizmos = true;

    private Rigidbody2D rb;
    private CapsuleCollider2D capsuleCollider;
    private Animator animator;

    private static readonly int IsGroundedHash = Animator.StringToHash("isGrounded");
    private static readonly int YVelocityHash = Animator.StringToHash("yVelocity");
    private static readonly int IsSlidingHash = Animator.StringToHash("isSliding");

    private Vector2 originalColliderSize;
    private Vector2 originalColliderOffset;
    private float defaultGravityScale;
    private Coroutine currentSlideCoroutine;

    private bool isGrounded;
    private bool wasGroundedLastFrame;
    private bool isSliding;
    private bool wantsToSlideOnLanding;
    private float fixedXPosition;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        capsuleCollider = GetComponent<CapsuleCollider2D>();
        animator = GetComponent<Animator>();

        originalColliderSize = capsuleCollider.size;
        originalColliderOffset = capsuleCollider.offset;
        defaultGravityScale = rb.gravityScale;
        fixedXPosition = transform.position.x;
    }

    private void Update()
    {
        isGrounded = CheckGround();

        if (!wasGroundedLastFrame && isGrounded)
        {
            OnLanded();
        }

        // --- SISTEMA DE INPUT HÍBRIDO (TECLADO + TÁCTIL) ---
        bool jumpPressed = Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow);
        bool slidePressed = Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.LeftControl);

        // Lógica para pantallas táctiles (Móviles)
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            if (touch.phase == TouchPhase.Began)
            {
                // Si toca la mitad derecha de la pantalla = Saltar
                if (touch.position.x > Screen.width / 2f) jumpPressed = true;
                // Si toca la mitad izquierda de la pantalla = Deslizar
                else slidePressed = true;
            }
        }

        // Procesamiento de Salto
        if (jumpPressed)
        {
            if (isSliding)
            {
                CancelSlide();
                Jump();
            }
            else if (isGrounded)
            {
                Jump();
            }
        }

        // Procesamiento de Deslizamiento y Dive
        if (slidePressed)
        {
            if (isGrounded && !isSliding)
            {
                Slide();
            }
            else if (!isGrounded)
            {
                PerformFastFallDive();
            }
        }

        #if UNITY_6000_0_OR_NEWER
        float verticalVelocity = rb.linearVelocity.y;
        #else
        float verticalVelocity = rb.velocity.y;
        #endif

        if (verticalVelocity < 0f && !isGrounded)
        {
            rb.gravityScale = defaultGravityScale * fallMultiplier;
        }
        else
        {
            rb.gravityScale = defaultGravityScale;
        }

        if (animator != null)
        {
            animator.SetBool(IsGroundedHash, isGrounded);
            animator.SetFloat(YVelocityHash, verticalVelocity);
            animator.SetBool(IsSlidingHash, isSliding);
        }

        wasGroundedLastFrame = isGrounded;
    }

    private void LateUpdate()
    {
        if (transform.position.x != fixedXPosition)
        {
            Vector3 pos = transform.position;
            pos.x = fixedXPosition;
            transform.position = pos;
        }
    }

    public void Jump()
    {
        wantsToSlideOnLanding = false;
        #if UNITY_6000_0_OR_NEWER
        rb.linearVelocity = new Vector2(0f, 0f);
        #else
        rb.velocity = new Vector2(0f, 0f);
        #endif
        rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
    }

    public void CancelSlide()
    {
        if (currentSlideCoroutine != null)
        {
            StopCoroutine(currentSlideCoroutine);
            currentSlideCoroutine = null;
        }
        capsuleCollider.size = originalColliderSize;
        capsuleCollider.offset = originalColliderOffset;
        isSliding = false;
        if (animator != null) animator.SetBool(IsSlidingHash, false);
    }

    public void PerformFastFallDive()
    {
        #if UNITY_6000_0_OR_NEWER
        if (rb.linearVelocity.y > 0f) rb.linearVelocity = new Vector2(0f, 0f);
        #else
        if (rb.velocity.y > 0f) rb.velocity = new Vector2(0f, 0f);
        #endif
        rb.AddForce(Vector2.down * fastFallForce, ForceMode2D.Impulse);
        wantsToSlideOnLanding = true;
    }

    private void OnLanded()
    {
        bool isHoldingSlideKey = Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow) || Input.GetKey(KeyCode.LeftControl);

        // Soporte táctil para mantener presionado en la mitad izquierda
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            if (touch.position.x <= Screen.width / 2f && (touch.phase == TouchPhase.Stationary || touch.phase == TouchPhase.Moved))
            {
                isHoldingSlideKey = true;
            }
        }

        if (wantsToSlideOnLanding || isHoldingSlideKey)
        {
            wantsToSlideOnLanding = false;
            Slide();
        }
    }

    public void Slide()
    {
        if (currentSlideCoroutine != null) StopCoroutine(currentSlideCoroutine);
        currentSlideCoroutine = StartCoroutine(SlideRoutine());
    }

    private IEnumerator SlideRoutine()
    {
        isSliding = true;
        if (animator != null) animator.SetBool(IsSlidingHash, true);

        float halfHeight = originalColliderSize.y * 0.5f;
        capsuleCollider.size = new Vector2(originalColliderSize.x, halfHeight);
        float offsetDifference = (originalColliderSize.y - halfHeight) * 0.5f;
        capsuleCollider.offset = new Vector2(originalColliderOffset.x, originalColliderOffset.y - offsetDifference);

        yield return new WaitForSeconds(slideDuration);

        capsuleCollider.size = originalColliderSize;
        capsuleCollider.offset = originalColliderOffset;
        isSliding = false;
        if (animator != null) animator.SetBool(IsSlidingHash, false);
        currentSlideCoroutine = null;
    }

    private bool CheckGround()
    {
        Vector2 checkPosition = (Vector2)transform.position + groundCheckOffset;
        Collider2D hit = Physics2D.OverlapCircle(checkPosition, groundCheckRadius, groundLayer);
        return hit != null;
    }

    private void OnDrawGizmosSelected()
    {
        if (!showGizmos) return;
        Vector2 checkPosition = (Vector2)transform.position + groundCheckOffset;
        Gizmos.color = isGrounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(checkPosition, groundCheckRadius);
    }
}
`;


export const UNITY_INSPECTOR_INSTRUCTIONS = {
  rigidbody: {
    title: "1. Configuración de Rigidbody2D",
    description: "Componente encargado de la física de gravedad e impulso de salto.",
    items: [
      { param: "Body Type", value: "Dynamic", note: "Permite gravedad e impulso con AddForce." },
      { param: "Mass", value: "1", note: "Masa estándar para que la fuerza de salto de ~18 sea ágil y contundente." },
      { param: "Linear Drag", value: "0", note: "Sin resistencia al aire innecesaria." },
      { param: "Gravity Scale", value: "3.0 (Subido de 1 a 3)", note: "¡Evita el efecto gravedad lunar! Al subir la gravedad de 1 a 3, el personaje adquiere peso real de videojuego arcade." },
      { param: "Collision Detection", value: "Continuous", note: "CRÍTICO en móviles para evitar que el jugador atraviese el suelo al caer a gran velocidad." },

      { param: "Sleeping Mode", value: "Never Sleep", note: "Garantiza detección continua." },
      { param: "Interpolate", value: "Interpolate", note: "Suaviza el renderizado del movimiento entre frames de física." },
      { param: "Constraints", value: "Freeze Position X: [✓] | Freeze Rotation Z: [✓]", note: "Evita que el jugador se mueva horizontalmente por empujes y que rote o caiga de espaldas." },
    ]
  },
  collider: {
    title: "2. Configuración de CapsuleCollider2D",
    description: "Determina el volumen de colisión y se reduce a la mitad al deslizarse.",
    items: [
      { param: "Direction", value: "Vertical", note: "Cápsula orientada de pie." },
      { param: "Size", value: "X: 0.8 | Y: 1.8 (ajustar a tu sprite)", note: "El tamaño debe rodear el cuerpo del protagonista." },
      { param: "Offset", value: "X: 0 | Y: 0.9 (la mitad de Y si el pivote está en los pies)", note: "Al estar el pivote en Bottom Center (0,0), el centro de la cápsula debe subir exactamente la mitad de su altura (Y/2)." },
      { param: "Used By Effector", value: "False", note: "Desmarcado." },
    ]
  },
  layers: {
    title: "3. Configuración de Capas (Layers & LayerMask)",
    description: "Permite al OverlapCircle identificar exclusivamente el suelo y no autocolisionar con el jugador.",
    items: [
      { param: "Paso A: Crear Layer", value: "Edit -> Project Settings -> Tags and Layers", note: "En 'Layers' de usuario, asigna la capa 8 (o la primera libre) con el nombre exacto: Ground." },
      { param: "Paso B: Asignar a Plataformas", value: "Selecciona tus GameObjects de suelo/camino", note: "En el desplegable 'Layer' del Inspector superior, selecciona 'Ground'." },
      { param: "Paso C: En PlayerRunner", value: "Campo 'Ground Layer' en el Inspector", note: "Haz clic en el desplegable y marca únicamente la casilla 'Ground'." },
      { param: "Paso D: Layer del Jugador", value: "Layer: 'Player'", note: "Crea también una capa 'Player' para el protagonista. Así evitas colisiones no deseadas." },
    ]
  },
  spritePivot: {
    title: "4. Configuración del Pivote del Sprite (Bottom Center)",
    description: "Requisito pedido para el OverlapCircle en los pies.",
    items: [
      { param: "Sprite Editor", value: "Selecciona el Sprite en la carpeta Project", note: "En el Inspector: Sprite Mode -> Multiple (o Single), abre 'Sprite Editor'." },
      { param: "Pivot", value: "Bottom", note: "Selecciona el pivote 'Bottom' o 'Custom' con X: 0.5, Y: 0." },
      { param: "Ground Check Offset", value: "X: 0, Y: 0.05", note: "Una ligera elevación de 0.05 asegura que la esfera roce el suelo sin quedar enterrada." },
      { param: "Ground Check Radius", value: "0.2f", note: "Un radio de 0.15 a 0.25 es ideal. Puedes ver el círculo dibujado en la ventana Scene gracias a OnDrawGizmosSelected." },
    ]
  }
};

export const ENVIRONMENT_MOVER_CS_CODE = `using UnityEngine;

/// <summary>
/// Desplaza elementos del entorno (segmentos de suelo, obstáculos, monedas) hacia la izquierda.
/// Altamente optimizado para móviles: cachea el Transform, utiliza Space.World para
/// mantener la trayectoria y soporta desactivación para Object Pooling (evitando Garbage Collection).
/// </summary>
public class EnvironmentMover : MonoBehaviour
{
    [Header("--- VELOCIDAD Y MOVIMIENTO ---")]
    [Tooltip("Velocidad de traslación hacia la izquierda (unidades de Unity por segundo).")]
    [SerializeField] private float moveSpeed = 8f;

    [Header("--- LÍMITES Y OBJECT POOLING ---")]
    [Tooltip("Posición X (fuera de cámara por la izquierda) donde el objeto se destruye o recicla.")]
    [SerializeField] private float destructionX = -15f;

    [Tooltip("Si es true, desactiva el GameObject (SetActive(false)) para Object Pooling. Si es false, ejecuta Destroy().")]
    [SerializeField] private bool useObjectPooling = true;

    // Cache del componente Transform para máxima velocidad en Update
    private Transform cachedTransform;

    // Callback opcional para que un Pool Manager reciba aviso cuando el objeto sale de pantalla
    public System.Action<GameObject> OnRecycled;

    private void Awake()
    {
        cachedTransform = transform;
    }

    private void Update()
    {
        // 1. Desplazamiento constante hacia la izquierda en coordenadas de mundo
        cachedTransform.Translate(Vector3.left * (moveSpeed * Time.deltaTime), Space.World);

        // 2. Detección de límite izquierdo
        if (cachedTransform.position.x <= destructionX)
        {
            RecycleOrDestroy();
        }
    }

    /// <summary>
    /// Desactiva el objeto para reutilización en pool o lo destruye.
    /// </summary>
    private void RecycleOrDestroy()
    {
        if (useObjectPooling)
        {
            OnRecycled?.Invoke(gameObject);
            gameObject.SetActive(false);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    /// <summary>
    /// Permite sincronizar la velocidad desde un GameManager o Spawner centralizado.
    /// </summary>
    public void SetSpeed(float newSpeed)
    {
        moveSpeed = newSpeed;
    }

    public float MoveSpeed => moveSpeed;
    public float DestructionX => destructionX;
    public bool UseObjectPooling => useObjectPooling;
}
`;

export const UNITY_INSPECTOR_MOVER_INSTRUCTIONS = {
  title: "Configuración de EnvironmentMover en el Inspector",
  description: "Asigna este script a todos tus Prefabs que deban moverse hacia el jugador (suelo, obstáculos y coleccionables).",
  prefabs: [
    {
      target: "Prefabs de Suelo (Ground Tiles / Plataformas)",
      speed: "8f (o la velocidad base del juego)",
      destructionX: "-15f a -20f",
      pooling: "Activado (True)",
      tip: "Asegúrate de que el suelo tenga un BoxCollider2D en la capa 'Ground'. Cuando el tile pase de -15 en X, se desactiva y el spawner lo recolocará a la derecha (ej. X = +20) sin instanciar nada nuevo."
    },
    {
      target: "Prefabs de Obstáculos (Spikes, Pasteles, Candelabros)",
      speed: "8f (debe coincidir exactamente con el suelo)",
      destructionX: "-15f",
      pooling: "Activado (True)",
      tip: "Marca 'Is Trigger' en el Collider2D del obstáculo o déjalo físico según desees empuje o detección por OnTriggerEnter2D. Al salir de pantalla se recicla."
    },
    {
      target: "Prefabs de Monedas / Anillos de Boda",
      speed: "8f",
      destructionX: "-15f",
      pooling: "Activado (True)",
      tip: "CircleCollider2D con 'Is Trigger = true'. Si el jugador la recoge antes de -15, tu script de colección la desactiva inmediatamente sumando puntos."
    }
  ]
};

export const OBSTACLE_SPAWNER_CS_CODE = `using UnityEngine;

/// <summary>
/// Generador procedural de obstáculos para auto-runner 2D.
/// Instancia periódicamente prefabs aleatorios fuera de pantalla por la derecha
/// con una ligera variación aleatoria en el tiempo de spawn para evitar monotonía.
/// </summary>
public class ObstacleSpawner : MonoBehaviour
{
    [Header("--- PREFABS DE OBSTÁCULOS ---")]
    [Tooltip("Lista de prefabs de obstáculos (pasteles nupciales, espinas, candelabros flotantes, etc.).")]
    [SerializeField] private GameObject[] obstaclePrefabs;

    [Header("--- CADENCIA DE GENERACIÓN (SPAWN RATE) ---")]
    [Tooltip("Intervalo base de spawn en segundos (ej. 2.0s).")]
    [SerializeField] private float baseSpawnRate = 2.0f;

    [Tooltip("Variación aleatoria (+/- segundos) aplicada a cada ciclo para ritmo impredecible.")]
    [SerializeField] private float randomVariation = 0.5f;

    [Tooltip("Límite mínimo de seguridad para evitar que dos obstáculos aparezcan pegados e imposibles de esquivar.")]
    [SerializeField] private float minSpawnInterval = 1.0f;

    [Header("--- POSICIÓN DE SPAWN ---")]
    [Tooltip("Coordenada X (fuera de cámara por la derecha) donde nacerán los obstáculos.")]
    [SerializeField] private float spawnX = 15f;

    [Tooltip("Punto de referencia opcional (Transform) para ubicar el spawn visualmente en la escena.")]
    [SerializeField] private Transform spawnPoint;

    [Tooltip("Si es true, respeta la posición Y nativa configurada en el prefab (clave para alternar obstáculos de suelo vs de aire).")]
    [SerializeField] private bool usePrefabYPosition = true;

    [Tooltip("Altura Y por defecto si no se utiliza la del prefab.")]
    [SerializeField] private float defaultSpawnY = 0f;

    [Header("--- ESTADO ---")]
    [SerializeField] private bool isSpawning = true;

    // Temporizador interno
    private float timer;
    private float currentInterval;

    private void Start()
    {
        // Inicializamos con un primer intervalo aleatorio
        SetNextSpawnInterval();
        timer = currentInterval;
    }

    private void Update()
    {
        if (!isSpawning) return;

        timer -= Time.deltaTime;

        if (timer <= 0f)
        {
            SpawnRandomObstacle();
            SetNextSpawnInterval();
            timer = currentInterval;
        }
    }

    /// <summary>
    /// Selecciona aleatoriamente un prefab del array y lo instancia en la coordenada configurada.
    /// </summary>
    public void SpawnRandomObstacle()
    {
        if (obstaclePrefabs == null || obstaclePrefabs.Length == 0)
        {
            Debug.LogWarning("[ObstacleSpawner] No hay prefabs asignados en el array 'obstaclePrefabs'.");
            return;
        }

        // 1. Selección aleatoria entre los prefabs disponibles
        int randomIndex = Random.Range(0, obstaclePrefabs.Length);
        GameObject selectedPrefab = obstaclePrefabs[randomIndex];

        if (selectedPrefab == null) return;

        // 2. Cálculo de la posición (X fija a la derecha, Y según prefab o spawnPoint)
        float posX = spawnPoint != null ? spawnPoint.position.x : spawnX;
        float posY = usePrefabYPosition 
            ? selectedPrefab.transform.position.y 
            : (spawnPoint != null ? spawnPoint.position.y : defaultSpawnY);

        Vector3 spawnPosition = new Vector3(posX, posY, 0f);

        // 3. Instanciamos el prefab con su rotación original
        GameObject spawnedObj = Instantiate(selectedPrefab, spawnPosition, selectedPrefab.transform.rotation);

        // Aseguramos que el nuevo obstáculo tenga su script EnvironmentMover funcionando
        #if UNITY_EDITOR
        if (spawnedObj.GetComponent<EnvironmentMover>() == null)
        {
            Debug.LogWarning($"[ObstacleSpawner] El prefab '{selectedPrefab.name}' no tiene el componente EnvironmentMover asignado.");
        }
        #endif
    }

    /// <summary>
    /// Calcula el próximo intervalo con la variación aleatoria solicitada:
    /// interval = baseSpawnRate + Random.Range(-randomVariation, randomVariation)
    /// </summary>
    private void SetNextSpawnInterval()
    {
        float variation = Random.Range(-randomVariation, randomVariation);
        currentInterval = Mathf.Max(minSpawnInterval, baseSpawnRate + variation);
    }

    // --- MÉTODOS PÚBLICOS DE CONTROL (Para GameManagers y Pausa) ---
    public void StartSpawning() => isSpawning = true;
    public void StopSpawning() => isSpawning = false;
    public void SetBaseSpawnRate(float newRate) => baseSpawnRate = newRate;

    /// <summary>
    /// Dibuja la línea y punto de spawn en la ventana Scene View para calibrar fácilmente su posición.
    /// </summary>
    private void OnDrawGizmosSelected()
    {
        float posX = spawnPoint != null ? spawnPoint.position.x : spawnX;
        Gizmos.color = Color.yellow;
        Gizmos.DrawLine(new Vector3(posX, -8f, 0f), new Vector3(posX, 8f, 0f));
        Gizmos.DrawWireSphere(new Vector3(posX, defaultSpawnY, 0f), 0.5f);
    }
}
`;

export const UNITY_INSPECTOR_SPAWNER_INSTRUCTIONS = {
  title: "Configuración de ObstacleSpawner en el Inspector",
  description: "Crea un GameObject vacío llamado 'ObstacleSpawner' en la escena y agrégale este componente.",
  items: [
    {
      param: "Obstacle Prefabs (Array)",
      value: "Size: 2 a 4 prefabs",
      note: "Arrastra tus prefabs: 1) Obstáculo bajo para saltar (ej. pastel/pinchos) y 2) Obstáculo alto para deslizarse (ej. candelabro/guirnalda)."
    },
    {
      param: "Base Spawn Rate",
      value: "2.0s (ajustable de 1.5s a 3.0s)",
      note: "Tiempo promedio entre la aparición de cada obstáculo. Si la velocidad del suelo es 8 unidades/s, 2 segundos deja un espacio de 16 unidades."
    },
    {
      param: "Random Variation",
      value: "0.5s",
      note: "Añade un desfase aleatorio entre -0.5s y +0.5s (el intervalo real oscilará entre 1.5s y 2.5s), logrando un ritmo dinámico e impredecible."
    },
    {
      param: "Min Spawn Interval",
      value: "1.0s",
      note: "Candado de seguridad que evita que la variación aleatoria genere dos obstáculos pegados que sean físicamente imposibles de esquivar."
    },
    {
      param: "Spawn X",
      value: "15f a 18f",
      note: "Coordenada fuera de la cámara a la derecha (si la cámara ortográfica tiene size 5, su borde derecho suele estar en X ≈ 9 o 10; X=15 garantiza que aparezcan sin verse 'poppear')."
    },
    {
      param: "Use Prefab Y Position",
      value: "True [✓]",
      note: "Permite que el prefab del candelabro guarde su altura alta (ej. Y = 1.8) y el pastel guarde su altura baja (ej. Y = -1.2) sin necesidad de configurar alturas separadas en el código."
    }
  ]
};

export const BRIDE_CONTROLLER_CS_CODE = `using UnityEngine;

/// <summary>
/// Controlador principal de la perseguidora (Novia Monstruosa) para 2D Auto-Runner móvil.
/// Maneja la física de tensión elástica, penalización por tropiezos del jugador,
/// recuperación gradual de distancia y transiciones en el Animator.
/// </summary>
[RequireComponent(typeof(Animator))]
public class BridePursuer : MonoBehaviour
{
    public static BridePursuer Instance { get; private set; }

    [Header("--- OBJETIVO & SEGUIMIENTO ---")]
    [Tooltip("Referencia al Transform del jugador (novio).")]
    [SerializeField] private Transform playerTransform;

    [Tooltip("Distancia base o de confort en el eje X detrás del jugador (ej. 8 unidades).")]
    [SerializeField] private float baseDistance = 8.0f;

    [Tooltip("Tiempo de suavizado para el movimiento elástico (Mathf.SmoothDamp).")]
    [SerializeField] private float smoothTime = 0.25f;

    [Header("--- RECUPERACIÓN & TROPIEZOS (GAME FEEL) ---")]
    [Tooltip("Velocidad a la que el novio se aleja poco a poco si no comete errores (unidades por segundo).")]
    [SerializeField] private float recoverySpeed = 0.6f;

    [Tooltip("Distancia que se abalanza la novia hacia adelante al tropezar con un obstáculo.")]
    [SerializeField] private float stumblePenaltyDistance = 2.5f;

    [Header("--- UMBRALES DE PELIGRO Y CAPTURA ---")]
    [Tooltip("Distancia donde se activa la animación de ataque frenético (isAttacking = true).")]
    [SerializeField] private float dangerDistanceThreshold = 4.0f;

    [Tooltip("Distancia mínima de impacto que dispara el Game Over.")]
    [SerializeField] private float catchDistanceThreshold = 1.0f;

    [Header("--- ANIMATOR ---")]
    [Tooltip("Nombre del parámetro booleano en el Animator Controller.")]
    [SerializeField] private string attackParamName = "isAttacking";

    // Componentes y hashes en caché (Zero GC)
    private Animator animator;
    private int isAttackingHash;

    // Control de movimiento elástico
    private float currentDistanceX;
    private float targetDistanceX;
    private float velocityX; // Usado internamente por Mathf.SmoothDamp

    // Estados
    private bool isAttacking;
    private bool playerCaught;

    // Eventos públicos para GameManagers, UI y Audio
    public event System.Action OnPlayerCaught;
    public event System.Action<float> OnDistanceChanged;
    public event System.Action OnLungeTriggered;

    private void Awake()
    {
        // Singleton pattern para fácil acceso desde obstáculos
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
            return;
        }

        animator = GetComponent<Animator>();
        isAttackingHash = Animator.StringToHash(attackParamName);

        // Búsqueda automática del jugador si no fue arrastrado al Inspector
        if (playerTransform == null)
        {
            PlayerRunner player = Object.FindFirstObjectByType<PlayerRunner>();
            if (player != null)
            {
                playerTransform = player.transform;
            }
        }

        // Inicializamos con la distancia base
        targetDistanceX = baseDistance;
        currentDistanceX = baseDistance;

        if (playerTransform != null)
        {
            Vector3 startPos = transform.position;
            startPos.x = playerTransform.position.x - baseDistance;
            transform.position = startPos;
        }
    }

    private void Update()
    {
        if (playerTransform == null || playerCaught) return;

        // 1. RECUPERACIÓN GRADUAL: Si la novia está más cerca que la baseDistance,
        // la distancia objetivo se amplía lentamente si el jugador corre limpiamente
        if (targetDistanceX < baseDistance)
        {
            targetDistanceX = Mathf.MoveTowards(targetDistanceX, baseDistance, recoverySpeed * Time.deltaTime);
        }

        // 2. MOVIMIENTO ELÁSTICO (SmoothDamp): Posicionamiento suave en el eje X
        float desiredX = playerTransform.position.x - targetDistanceX;
        float newX = Mathf.SmoothDamp(transform.position.x, desiredX, ref velocityX, smoothTime);

        Vector3 pos = transform.position;
        pos.x = newX;
        transform.position = pos;

        // 3. MEDICIÓN DE DISTANCIA REAL
        currentDistanceX = playerTransform.position.x - transform.position.x;
        OnDistanceChanged?.Invoke(currentDistanceX);

        // 4. TRANSICIÓN DE ANIMATOR (Persecución Normal vs Ataque Frenético)
        bool inDanger = currentDistanceX <= dangerDistanceThreshold;
        if (inDanger != isAttacking)
        {
            isAttacking = inDanger;
            if (animator != null)
            {
                animator.SetBool(isAttackingHash, isAttacking);
            }
        }

        // 5. CONDICIÓN DE CAPTURA (GAME OVER)
        if (currentDistanceX <= catchDistanceThreshold && !playerCaught)
        {
            playerCaught = true;
            Debug.Log("[BridePursuer] ¡Novia atrapó al jugador! Game Over.");
            OnPlayerCaught?.Invoke();
        }
    }

    /// <summary>
    /// Llamado cuando el jugador choca o tropieza contra un obstáculo.
    /// La novia se abalanza hacia adelante de forma instantánea.
    /// </summary>
    public void OnPlayerStumbled(float customPenalty = -1f)
    {
        if (playerCaught) return;

        float penalty = customPenalty > 0f ? customPenalty : stumblePenaltyDistance;

        // Reducimos la distancia objetivo
        targetDistanceX = Mathf.Max(catchDistanceThreshold * 1.05f, targetDistanceX - penalty);

        // Aceleramos el movimiento inmediato
        velocityX += penalty * 2f;

        OnLungeTriggered?.Invoke();
    }

    /// <summary>
    /// Permite reiniciar la posición al reiniciar la partida o cambiar de nivel.
    /// </summary>
    public void ResetPursuit()
    {
        targetDistanceX = baseDistance;
        currentDistanceX = baseDistance;
        playerCaught = false;
        isAttacking = false;
        velocityX = 0f;

        if (animator != null)
        {
            animator.SetBool(isAttackingHash, false);
        }

        if (playerTransform != null)
        {
            Vector3 pos = transform.position;
            pos.x = playerTransform.position.x - baseDistance;
            transform.position = pos;
        }
    }

    // --- PROPIEDADES PÚBLICAS (Útiles para UI, barras de tensión y efectos de audio) ---
    public float CurrentDistance => currentDistanceX;
    public float BaseDistance => baseDistance;
    public bool IsInDangerZone => isAttacking;
    public bool PlayerCaught => playerCaught;

    /// <summary>
    /// Retorna un valor de 0 a 1 representando el nivel de peligro/tensión
    /// (0 = seguro a baseDistance, 1 = captura inminente).
    /// </summary>
    public float TensionNormalized
    {
        get
        {
            float range = baseDistance - catchDistanceThreshold;
            if (range <= 0.01f) return 1f;
            return Mathf.Clamp01(1f - (currentDistanceX - catchDistanceThreshold) / range);
        }
    }

    private void OnDrawGizmosSelected()
    {
        if (playerTransform == null) return;

        // 1. Línea hacia el jugador
        Gizmos.color = Color.gray;
        Gizmos.DrawLine(transform.position, playerTransform.position);

        // 2. Zona de Peligro (Amarillo / Naranja)
        Gizmos.color = new Color(1f, 0.6f, 0f, 0.5f);
        Vector3 dangerPos = playerTransform.position - new Vector3(dangerDistanceThreshold, 0f, 0f);
        Gizmos.DrawWireSphere(dangerPos, 0.5f);

        // 3. Zona de Captura / Game Over (Rojo)
        Gizmos.color = Color.red;
        Vector3 catchPos = playerTransform.position - new Vector3(catchDistanceThreshold, 0f, 0f);
        Gizmos.DrawWireSphere(catchPos, 0.5f);
    }
}
`;

export const UNITY_INSPECTOR_BRIDE_INSTRUCTIONS = {
  title: "Configuración de BridePursuer en el Inspector de Unity",
  description: "Crea el GameObject 'Bride' en tu escena, asígnale el SpriteRenderer con el sprite de la novia, su Animator Controller y este script BridePursuer.",
  items: [
    {
      param: "Player Transform",
      value: "Arrastra el GameObject 'Player'",
      note: "Si se deja vacío, el script buscará automáticamente el componente PlayerRunner en tiempo de ejecución."
    },
    {
      param: "Base Distance",
      value: "8.0f unidades",
      note: "Distancia de seguridad deseada detrás del jugador. En resolución 16:9 con cámara ortográfica tamaño 5, 8 unidades la sitúa visible en el borde izquierdo de la pantalla."
    },
    {
      param: "Smooth Time",
      value: "0.25s",
      note: "Controla la inercia del movimiento elástico. Un valor entre 0.2s y 0.3s otorga una persecución fluida y orgánica sin tirones."
    },
    {
      param: "Recovery Speed",
      value: "0.6f unidades/segundo",
      note: "Premia la habilidad del jugador: mientras más tiempo corra sin tropezar, la novia irá retrocediendo poco a poco hacia su distancia base."
    },
    {
      param: "Stumble Penalty Distance",
      value: "2.5f unidades",
      note: "¡Impacto directo en Game Feel! Cada vez que el jugador colisione con un pastel o trampa, la novia avanza 2.5m de golpe hacia él."
    },
    {
      param: "Danger Distance Threshold",
      value: "4.0f unidades",
      note: "Umbral de pánico: cuando la distancia X es menor a 4m, activa en el Animator 'isAttacking = true' (animación frenética de carrera con rodillo en mano)."
    },
    {
      param: "Catch Distance Threshold",
      value: "1.0f unidad",
      note: "Punto de colisión/captura: cuando la novia llega a 1m de distancia, dispara el evento OnPlayerCaught para congelar el nivel y mostrar la pantalla de Game Over."
    }
  ]
};


export const UNITY_ANIMATOR_SETUP_INSTRUCTIONS = {
  title: "Guía de Sprite Editor & Animator Controller (2D Auto-Runner)",
  spriteEditor: [
    {
      title: "Configuración de Importación de la Textura",
      steps: [
        "Selecciona el archivo PNG de la hoja de sprites en tu carpeta Assets/Sprites/.",
        "En el Inspector: cambia Texture Type a 'Sprite (2D and UI)'.",
        "Cambia Sprite Mode de 'Single' a 'Multiple'.",
        "Configura Pixels Per Unit (suele ser 16, 32 o 64 según el tamaño de tu arte).",
        "En Filter Mode selecciona 'Point (no filter)' si es pixel art, o 'Bilinear' si es vectorial con bordes suaves.",
        "Haz clic en 'Apply' y pulsa el botón 'Sprite Editor'."
      ]
    },
    {
      title: "Recorte (Slice) y Regla de Oro del Pivote: Bottom Center",
      steps: [
        "En la ventana del Sprite Editor, haz clic en el menú desplegable 'Slice' (arriba a la izquierda).",
        "Tipo de Slice: Elige 'Automatic' o 'Grid by Cell Size' / 'Grid by Cell Count' según cómo estén organizadas las filas.",
        "¡CRÍTICO!: En el campo Pivot, selecciona 'Bottom' (o Custom con X: 0.5, Y: 0.0).",
        "¿Por qué es indispensable el Bottom Center? Al deslizarse, el personaje pasa de estar erguido a tenderse horizontalmente a ras de suelo. Si el pivote estuviera en el centro (Center 0.5, 0.5), el sprite flotaría en el aire o se hundiría atravesando el suelo al cambiar de animación. Con Bottom Center, los pies y la base permanecen siempre anclados a la superficie.",
        "Haz clic en 'Slice' y luego en 'Apply' (arriba a la derecha)."
      ]
    }
  ],
  playerAnimator: {
    title: "Estructura del Animator Controller: PlayerRunner",
    parameters: [
      { name: "isGrounded", type: "Bool", desc: "True cuando el OverlapCircle toca la capa Ground; False en el aire." },
      { name: "yVelocity", type: "Float", desc: "Velocidad vertical del Rigidbody2D (>0 subiendo, <0 cayendo)." },
      { name: "isSliding", type: "Bool", desc: "True durante la corrutina de deslizamiento (0.4s)." }
    ],
    states: [
      { state: "Correr (Default State)", clip: "Fila CORRER (Derecha, 10 frames en loop)", color: "border-emerald-500" },
      { state: "Saltar (Ascenso)", clip: "Fila SALTAR (Derecha, frames de impulso vertical)", color: "border-blue-500" },
      { state: "Caer (Descenso)", clip: "Fila CAER (Derecha, frames de picada hacia el suelo)", color: "border-purple-500" },
      { state: "Deslizarse (Slide)", clip: "Fila DESLIZARSE (Derecha, cuerpo agachado a ras de suelo)", color: "border-amber-500" }
    ],
    transitions: [
      {
        from: "Correr",
        to: "Saltar",
        conditions: "isGrounded == false AND yVelocity > 0.1",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.05s."
      },
      {
        from: "Saltar",
        to: "Caer",
        conditions: "yVelocity < -0.1",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.05s."
      },
      {
        from: "Caer",
        to: "Correr",
        conditions: "isGrounded == true",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.05s (Aterrizaje inmediato)."
      },
      {
        from: "Correr",
        to: "Deslizarse",
        conditions: "isSliding == true",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.02s (Respuesta inmediata)."
      },
      {
        from: "Deslizarse",
        to: "Correr",
        conditions: "isSliding == false",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.05s."
      }
    ]
  },
  brideAnimator: {
    title: "Estructura del Animator Controller: BrideController",
    parameters: [
      { name: "isAttacking", type: "Bool (o Trigger)", desc: "True cuando la distancia X <= dangerDistanceThreshold (4m)." }
    ],
    states: [
      { state: "Persecucion_Normal (Default)", clip: "Fila CORRER (Derecha, 10 frames de novia trotando)", color: "border-slate-500" },
      { state: "Ataque_Frenetico", clip: "Fila ATAQUE / PERSECUCIÓN (Derecha, 7 frames con lengua fuera y zancada furiosa)", color: "border-rose-500" }
    ],
    transitions: [
      {
        from: "Persecucion_Normal",
        to: "Ataque_Frenetico",
        conditions: "isAttacking == true",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.05s."
      },
      {
        from: "Ataque_Frenetico",
        to: "Persecucion_Normal",
        conditions: "isAttacking == false",
        settings: "Has Exit Time: [ ] (Desmarcado), Transition Duration: 0.1s."
      }
    ]
  }
};

export const OBSTACLE_COLLISION_CS_CODE = `using UnityEngine;

/// <summary>
/// Manejador de colisión para prefabs de obstáculos (Pasteles, Candelabros, Barriles).
/// Se adjunta a cada prefab y utiliza Collider2D con IsTrigger = true.
/// Compatible al 100% con Object Pooling (reinicia flags en OnEnable).
/// </summary>
[RequireComponent(typeof(Collider2D))]
public class ObstacleCollisionHandler : MonoBehaviour
{
    [Header("--- PENALIZACIÓN DE PERSECUCIÓN ---")]
    [Tooltip("Metros que la novia se abalanza hacia adelante al impactar este obstáculo.")]
    [SerializeField] private float stumblePenalty = 2.5f;

    [Header("--- COMPORTAMIENTO TRAS EL CHOQUE ---")]
    [Tooltip("Si es true, desactiva el obstáculo al chocar (SetActive(false)) para evitar dobles golpes y permitir reciclaje.")]
    [SerializeField] private bool deactivateOnHit = true;

    [Tooltip("Prefab de partículas de impacto (crema de pastel, astillas o chispas).")]
    [SerializeField] private GameObject hitEffectPrefab;

    [Tooltip("Clip de sonido que se reproduce al golpear.")]
    [SerializeField] private AudioClip hitSound;

    // Evita registrar dos colisiones en el mismo frame
    private bool hasCollided;

    private void OnEnable()
    {
        // ¡Crítico para Object Pooling! Al reutilizar el prefab, reiniciamos el flag de colisión
        hasCollided = false;
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        // Verificamos si es el jugador mediante Tag de alta eficiencia
        if (!hasCollided && other.CompareTag("Player"))
        {
            hasCollided = true;

            // 1. Notificar a la IA de la Novia para que se abalance
            if (BridePursuer.Instance != null)
            {
                BridePursuer.Instance.OnPlayerStumbled(stumblePenalty);
            }

            // 2. Notificar al GameManager para sumar tropiezos y registrar estadísticas
            if (GameManager.Instance != null)
            {
                GameManager.Instance.ReportStumble();
            }

            // 3. Feedback visual (partículas)
            if (hitEffectPrefab != null)
            {
                Instantiate(hitEffectPrefab, transform.position, Quaternion.identity);
            }

            // 4. Feedback auditivo
            if (hitSound != null)
            {
                AudioSource.PlayClipAtPoint(hitSound, transform.position);
            }

            // 5. Desactivar para Object Pool
            if (deactivateOnHit)
            {
                gameObject.SetActive(false);
            }
        }
    }
}
`;

export const GAME_MANAGER_CS_CODE = `using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

/// <summary>
/// Administrador principal del estado de la partida para 2D Auto-Runner móvil.
/// Controla el puntaje (distancia recorrida y monedas/anillos), la velocidad global
/// del entorno y el ciclo de vida de Game Over.
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public enum GameState
    {
        Ready,
        Playing,
        GameOver
    }

    [Header("--- ESTADO ACTUAL ---")]
    [SerializeField] private GameState currentState = GameState.Playing;

    [Header("--- VELOCIDAD & DIFICULTAD DINÁMICA ---")]
    [Tooltip("Velocidad de avance en metros por segundo para el conteo de distancia.")]
    [SerializeField] private float runSpeed = 10f;

    [Tooltip("Multiplicador de dificultad: aumenta la velocidad con el tiempo.")]
    [SerializeField] private bool dynamicDifficulty = true;
    [SerializeField] private float speedIncreaseRate = 0.05f;

    [Header("--- UI CANVAS (OPCIONAL) ---")]
    [Tooltip("Panel UI que se muestra al perder.")]
    [SerializeField] private GameObject gameOverPanel;

    // Métricas de la partida
    private float distanceTraveled;
    private int ringsCollected;
    private int totalStumbles;

    // Eventos públicos
    public event System.Action<float> OnDistanceUpdated;
    public event System.Action<int> OnRingsUpdated;
    public event System.Action OnGameOverTriggered;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
            return;
        }
    }

    private void Start()
    {
        // Nos suscribimos al evento de captura de la novia
        if (BridePursuer.Instance != null)
        {
            BridePursuer.Instance.OnPlayerCaught += HandlePlayerCaught;
        }

        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(false);
        }

        currentState = GameState.Playing;
    }

    private void OnDestroy()
    {
        if (BridePursuer.Instance != null)
        {
            BridePursuer.Instance.OnPlayerCaught -= HandlePlayerCaught;
        }
    }

    private void Update()
    {
        if (currentState != GameState.Playing) return;

        // 1. Aumento progresivo de dificultad
        if (dynamicDifficulty)
        {
            runSpeed += speedIncreaseRate * Time.deltaTime;
        }

        // 2. Conteo de distancia recorrida
        distanceTraveled += runSpeed * Time.deltaTime;
        OnDistanceUpdated?.Invoke(distanceTraveled);
    }

    /// <summary>
    /// Llamado cuando el jugador recoge una moneda o anillo de oro.
    /// </summary>
    public void AddRing(int amount = 1)
    {
        ringsCollected += amount;
        OnRingsUpdated?.Invoke(ringsCollected);
    }

    /// <summary>
    /// Registra un tropiezo contra obstáculo.
    /// </summary>
    public void ReportStumble()
    {
        totalStumbles++;
    }

    /// <summary>
    /// Maneja la derrota cuando la novia alcanza al novio (distancia <= 1m).
    /// </summary>
    private void HandlePlayerCaught()
    {
        if (currentState == GameState.GameOver) return;

        currentState = GameState.GameOver;
        Debug.Log("[GameManager] ¡Fin del juego! Distancia final: " + Mathf.FloorToInt(distanceTraveled) + "m");

        // Detenemos los generadores de obstáculos
        if (ObstacleSpawner.Instance != null)
        {
            ObstacleSpawner.Instance.enabled = false;
        }

        // Activamos panel de Game Over
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(true);
        }

        OnGameOverTriggered?.Invoke();
    }

    /// <summary>
    /// Reinicia la partida recargando la escena actual.
    /// </summary>
    public void RestartGame()
    {
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    // --- GETTERS PÚBLICOS ---
    public GameState CurrentState => currentState;
    public float DistanceTraveled => distanceTraveled;
    public int RingsCollected => ringsCollected;
    public int TotalStumbles => totalStumbles;
    public float CurrentRunSpeed => runSpeed;
}
`;

export const UNITY_INSPECTOR_COLLISION_INSTRUCTIONS = {
  title: "Configuración de Prefabs de Obstáculos & Triggers",
  description: "En juegos tipo auto-runner (Rayman Jungle Run, Jetpack Joyride), los obstáculos deben usar Collider2D con IsTrigger = true para evitar bloqueos físicos indeseados.",
  items: [
    {
      param: "Collider2D -> Is Trigger",
      value: "True [✓] (Marcado)",
      note: "¡Esencial! Un trigger detecta colisión mediante OnTriggerEnter2D sin frenar ni empujar físicamente al Rigidbody2D del jugador."
    },
    {
      param: "Tag del Jugador",
      value: "'Player'",
      note: "Asegúrate de que el GameObject del novio tenga el Tag 'Player' asignado en el Inspector (arriba a la izquierda)."
    },
    {
      param: "Layer de Obstáculos",
      value: "Crea una Layer 'Obstacle'",
      note: "Permite filtrar qué objetos son suelo (Ground), cuáles son jugador (Player) y cuáles son peligros (Obstacle) en la Collision Matrix."
    },
    {
      param: "Stumble Penalty",
      value: "2.5f unidades",
      note: "Distancia que la novia acorta de inmediato al impactar con este prefab."
    },
    {
      param: "Deactivate On Hit",
      value: "True [✓]",
      note: "Oculta el obstáculo al chocar para evitar dobles colisiones y dejarlo listo para el reciclaje en Object Pool."
    }
  ]
};



