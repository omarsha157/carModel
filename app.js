const tabs = document.querySelectorAll('.tab');
const menu = document.querySelector('.menu');
const menuModal = document.querySelector('.menu-modal');
const menuClose = document.querySelector('.close-modal');
const cards = document.querySelectorAll('.card');

// Model mapping for sedan and SUV
const modelMap = {
    sedan: {
        modelName: 'sedan',
        modelPath: './assets/sedan.glb',
        modelRotation: Math.PI // 180 degrees for the sedan
    },
    suv: {
        modelName: 'suv',
        modelPath: './assets/suv.glb',
        modelRotation: 0 // No rotation for the SUV
    }
};

// Event listener for each card to load the respective model
cards.forEach(card => {
    card.addEventListener('click', () => {
        const selectedModel = card.dataset.modelName;
        console.log(`Selected car model: ${selectedModel}`);
        loadCarModel(modelMap[selectedModel].modelPath);

        cards.forEach(card => {
            card.classList.remove('active')
        })
        card.classList.add('active')

        menuModal.classList.toggle('hide');
    });
});

// Function to load and replace car model in the scene
// Function to load and replace car model in the scene
function loadCarModel(modelPath) {
    // Remove the current car model from the scene if it exists
    if (carModel) {
        scene.remove(carModel);
    }

    // Load the new model from the given path
    loader.load(modelPath, (gltf) => {
        carModel = gltf.scene;
        scene.add(carModel);

        // Reset position and scale
        carModel.position.set(0, 0, 0);

        // Retrieve the model rotation from modelMap based on modelPath
        const selectedModel = Object.values(modelMap).find(model => model.modelPath === modelPath);
        if (selectedModel && selectedModel.modelRotation !== undefined) {
            carModel.rotation.y = selectedModel.modelRotation; // Apply the rotation from the model map
        }

        // Update scale based on viewport
        updateCarScale();

        // Compute the bounding box and center the model
        const boundingBox = new THREE.Box3().setFromObject(carModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        carModel.position.sub(center); // Move the model to the center

        // Calculate the size of the bounding box (model size)
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        // Set the camera distance proportional to the model's size
        const cameraDistance = maxDimension * 2; // Adjust the factor if needed
        camera.position.set(0, cameraDistance / 2, cameraDistance); // Offset camera up and back

        // Ensure the camera looks at the center of the model
        camera.lookAt(carModel.position);

        console.log(`Loaded model from: ${modelPath}`);
    }, undefined, (error) => {
        console.error('An error occurred while loading the model:', error);
    });
}



// Tabs logic
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

// 3D Model setup using THREE.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.opacity = 1;

document.getElementById('container').appendChild(renderer.domElement);

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Add directional light for better shadows and highlights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load car model using the function
let carModel;
const loader = new THREE.GLTFLoader();

// Load the default car model (SUV in this case)
loadCarModel('./assets/sedan.glb');

// Scale the car model based on the viewport width
function updateCarScale() {
    if (carModel) {
        const viewportWidth = window.innerWidth;
        const scaleFactor = viewportWidth / 1500; // Adjust this factor as needed
        carModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

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
