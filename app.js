const tabs = document.querySelectorAll('.tab');
const menu = document.querySelector('.menu');
const menuModal = document.querySelector('.menu-modal');
const menuClose = document.querySelector('.close-modal');

// ? tabs logic
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(tab => {
            tab.classList.remove('selected-tab');
        });
        tab.classList.add('selected-tab');
    });
});

menu.addEventListener('click', () => {
    menuModal.classList.toggle('hide');
});

// Access camera feed
const videoElement = document.getElementById('videoElement');
const captureCanvas = document.getElementById('captureCanvas');
const captureContext = captureCanvas.getContext('2d');
let capturedImage;
let videoStream; // Store the video stream

function startVideoStream() {
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { exact: "environment" } // Prefer rear camera
        }
    }).then((stream) => {
        videoStream = stream;
        videoElement.srcObject = stream;
    }).catch((error) => {
        console.error('Fallback error accessing camera:', error);

        navigator.mediaDevices.getUserMedia({
            video: true // Try to access any video source first
        }).then((stream) => {
            videoStream = stream;
            videoElement.srcObject = stream;
        }).catch((error) => {
            console.error('Error accessing camera:', error);
            // Attempt to access the rear camera as a fallback
        });
    });
}

// Start the video stream
startVideoStream();

// Capture the image when the button is clicked
document.querySelector('.shutter').addEventListener('click', () => {
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
    captureContext.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
    capturedImage = captureCanvas.toDataURL('image/png'); // Save image as variable
    document.getElementById('capturedImage').src = capturedImage; // Set the image source to the captured image
    document.getElementById('capturedImage').style.display = 'block'; // Show the captured image

    // Hide model and stop video feed
    document.getElementById('container').style.display = 'none'; // Hide 3D model
    videoStream.getTracks().forEach(track => track.stop()); // Stop the video feed
});

// Reset functionality
document.querySelector('.retake').addEventListener('click', () => {
    // Reset captured image and hide it
    document.getElementById('capturedImage').src = ''; // Clear the image source
    document.getElementById('capturedImage').style.display = 'none'; // Hide captured image

    // Clear the canvas
    captureContext.clearRect(0, 0, captureCanvas.width, captureCanvas.height);

    // Show 3D model again
    document.getElementById('container').style.display = 'flex'; // Show 3D model

    // Stop the previous video stream and start a new one
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop()); // Stop any existing stream
    }
    startVideoStream(); // Restart the video feed
});

// ? model
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.opacity = 0.5;

document.getElementById('container').appendChild(renderer.domElement);

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Add directional light for better shadows and highlights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load car model
let carModel;
const loader = new THREE.GLTFLoader();
loader.load('./assets/generic_sedan_car.glb', (gltf) => {
    carModel = gltf.scene;
    scene.add(carModel);
    
    // Set the initial position of the car model
    carModel.position.set(0, -0.7, 0);

    // Calculate the initial scale based on the viewport width
    updateCarScale();

    camera.position.set(0, 0, -2.8);
    camera.lookAt(carModel.position);
}, undefined, (error) => {
    console.error('An error occurred while loading the model:', error);
});

// Scale the car model based on the viewport width
function updateCarScale() {
    if (carModel) {
        const viewportWidth = window.innerWidth;
        const scaleFactor = viewportWidth / 1500; // Adjust this factor as needed
        carModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Log updated scale
        console.log(`Updated car model scale: ${carModel.scale.x}`);
    }
}

// Orbit controls for user interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.5;
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 2;
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = true;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
function updateRendererSize() {
    const container = document.querySelector('.viewport');
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Scale the car model on resize
    updateCarScale();
}

window.addEventListener('resize', updateRendererSize);
updateRendererSize();
