const tabs = document.querySelectorAll('.tab');
const menu = document.querySelector('.menu');
const menuModal = document.querySelector('.menu-modal');
const menuClose = document.querySelector('.close-modal');
const cards = document.querySelectorAll('.card');

let landscapePrompt = document.querySelector('.landscape-modal');
let mainWrapper = document.querySelector('.main-wrapper');

let shutterModal = document.querySelector('.shutter-modal')
let shutterModalClose = document.querySelector('.shutter-modal img')

let didModelMove = false

let cameraWidth = 0;  
let cameraHeight = 0; 

let activeTab = 'front'

let frontImg = ''
let rightImg = ''
let rearImg = ''
let leftImg = ''

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


shutterModalClose.addEventListener('click', () => {
    shutterModal.style.display = 'none'
})

menu.addEventListener('click', () => {
    menuModal.classList.toggle('hide');
});

// Event listener for each card to load the respective model
cards.forEach(card => {
    card.addEventListener('click', () => {
        const selectedModel = card.dataset.modelName;

        loadCarModel(modelMap[selectedModel].modelPath);

        cards.forEach(card => {
            card.classList.remove('active')
        })
        card.classList.add('active')

        menuModal.classList.toggle('hide');
    });
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

        // Once the metadata is loaded, get the video resolution
        videoElement.addEventListener('loadedmetadata', () => {
            cameraWidth = videoElement.videoWidth;
            cameraHeight = videoElement.videoHeight;
            console.log('Camera resolution:', cameraWidth, 'x', cameraHeight); // Log the resolution for confirmation
        });
    }).catch((error) => {
        console.error('Fallback error accessing camera:', error);

        navigator.mediaDevices.getUserMedia({
            video: true // Try to access any video source first
        }).then((stream) => {
            videoStream = stream;
            videoElement.srcObject = stream;

            // Get the video resolution
            videoElement.addEventListener('loadedmetadata', () => {
                cameraWidth = videoElement.videoWidth;
                cameraHeight = videoElement.videoHeight;
                console.log('Camera resolution:', cameraWidth, 'x', cameraHeight); // Log the resolution for confirmation
            });
        }).catch((error) => {
            console.error('Error accessing camera:', error);
        });
    });
}

// Start the video stream
startVideoStream();

// Capture the image when the button is clicked
document.querySelector('.shutter').addEventListener('click', () => {

    if (didModelMove) {
        shutterModal.style.display = 'grid'
        return
    }

    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
    captureContext.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
    capturedImage = captureCanvas.toDataURL('image/png'); // Save image as variable
    // Show the captured image

    if (activeTab == 'front') {
        frontImg = capturedImage
        document.querySelector('.selected-tab .status-dot').classList.add('active-dot')
    } else if (activeTab == 'right') {
        rightImg = capturedImage
        document.querySelector('.selected-tab .status-dot').classList.add('active-dot')
    } else if (activeTab == 'rear') {
        rearImg = capturedImage
        document.querySelector('.selected-tab .status-dot').classList.add('active-dot')
    } else if (activeTab == 'left') {
        leftImg = capturedImage
        document.querySelector('.selected-tab .status-dot').classList.add('active-dot')
    }

    document.getElementById('capturedImage').src = capturedImage; // Set the image source to the captured image
    document.getElementById('capturedImage').style.display = 'block';

    // Hide model and stop video feed
    document.getElementById('container').style.display = 'none'; // Hide 3D model
    videoStream.getTracks().forEach(track => track.stop()); // Stop the video feed
});

// Reset functionality
document.querySelector('.retake').addEventListener('click', () => {
    if (didModelMove) {
        shutterModal.style.display = 'grid'
        return
    }

    if (activeTab == 'front') {
        frontImg = ''
        document.querySelector('.selected-tab .status-dot').classList.remove('active-dot')
    } else if (activeTab == 'right') {
        rightImg = ''
        document.querySelector('.selected-tab .status-dot').classList.remove('active-dot')
    } else if (activeTab == 'rear') {
        rearImg = ''
        document.querySelector('.selected-tab .status-dot').classList.remove('active-dot')
    } else if (activeTab == 'left') {
        leftImg = ''
        document.querySelector('.selected-tab .status-dot').classList.remove('active-dot')
    }

    retake()
});


function retake() {
    // Reset captured image and hide it
    document.getElementById('capturedImage').src = ''; // Clear the image source
    document.getElementById('capturedImage').style.display = 'none'; // Hide captured image

    // Clear the canvas
    captureContext.clearRect(0, 0, captureCanvas.width, captureCanvas.height);

    // Show the 3D model and video feed again
    document.getElementById('container').style.display = 'flex'; // Show 3D model

    // No need to stop and start the video stream again, just ensure the video feed is visible
    if (!videoStream.active) {
        // If video stream was stopped, restart it
        startVideoStream();
    }
}



// Global variable to store the initial rotation of the loaded model
let initialModelRotation = 0;

// Modify loadCarModel to store the model's initial rotation
function loadCarModel(modelPath) {
    const loadingSpinner = document.querySelector('.loading-spinner');

    // Show loading spinner
    loadingSpinner.classList.remove('hide');

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
            initialModelRotation = selectedModel.modelRotation; // Store the initial rotation
            carModel.rotation.y = initialModelRotation; // Set the initial rotation
        }

        // Center and reset the model
        const boundingBox = new THREE.Box3().setFromObject(carModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        carModel.position.sub(center);

        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        const cameraDistance = maxDimension * 0.7;
        camera.position.set(0, cameraDistance / 2, cameraDistance);
        camera.lookAt(center);

        // Hide loading spinner
        loadingSpinner.classList.add('hide');
    }, undefined, (error) => {
        console.error('An error occurred while loading the model:', error);
        loadingSpinner.classList.add('hide');
    });
}



// 3D Model setup using THREE.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.height = '100%';
renderer.domElement.style.width = '100%';
renderer.domElement.style.opacity = 0.5;

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






// ? for landscape prompt

window.addEventListener('load', function() {
    screenSize();
});

function screenSize() {
    let screenHeight = window.innerHeight;
    let screenWidth = window.innerWidth;

    if (screenHeight > screenWidth) {
        landscapePrompt.style.display = 'block';
        mainWrapper.style.display = 'none';
    } else {
        landscapePrompt.style.display = 'none';
        mainWrapper.style.display = 'block';

        // Force re-render to ensure the model is visible immediately
        renderer.render(scene, camera);

        // Load the default car model (if it's not loaded already)
        if (!carModel) {
            loadCarModel('./assets/sedan.glb');
        }
    }
}

window.addEventListener('resize', () => {
    location.reload();
    screenSize();

    renderer.render(scene, camera);  // Ensure it renders properly after resizing
});

function resetOrbitRotation() {
    // Compute the bounding box and center the model
    const boundingBox = new THREE.Box3().setFromObject(carModel);
    const center = boundingBox.getCenter(new THREE.Vector3());
    
    // Explicitly center the car model based on its bounding box
    carModel.position.sub(center);

    // Calculate the size of the bounding box (model size)
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Set the camera distance proportional to the model's size
    const cameraDistance = maxDimension * 0.7;
    camera.position.set(0, cameraDistance / 2, cameraDistance); // Reset X and Y

    // Ensure the camera looks at the center of the model
    camera.lookAt(center);

    controls.update(); // Apply the camera changes
}

// Update rotation functions to account for initial model rotation
function faceCarFront() {
    resetOrbitRotation();
    carModel.rotation.set(0, initialModelRotation, 0); // Adjust by initial rotation
    controls.update();
    centerCarModel();
}

function faceCarLeft() {
    resetOrbitRotation();
    carModel.rotation.set(0, initialModelRotation - Math.PI / 2, 0); // Adjust by initial rotation
    controls.update();
    centerCarModel();
}

function faceCarRight() {
    resetOrbitRotation();
    carModel.rotation.set(0, initialModelRotation + Math.PI / 2, 0); // Adjust by initial rotation
    controls.update();
    centerCarModel();
}

function faceCarRear() {
    resetOrbitRotation();
    carModel.rotation.set(0, initialModelRotation + Math.PI, 0); // Adjust by initial rotation
    controls.update();
    centerCarModel();
}

// Function to ensure the car model is centered after each rotation
function centerCarModel() {
    const boundingBox = new THREE.Box3().setFromObject(carModel);
    const center = boundingBox.getCenter(new THREE.Vector3());
    carModel.position.sub(center);
}

// Tabs logic
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        activeTab = tab.dataset.activeTab
        didModelMove = false

        if (activeTab == 'front' && frontImg !== '') {
            faceCarFront()
            document.getElementById('capturedImage').src = frontImg
            document.getElementById('capturedImage').style.display = 'block';
            document.getElementById('container').style.display = 'none';
            videoStream.getTracks().forEach(track => track.stop());
        } else if (activeTab == 'right' && rightImg !== '') {
            faceCarRight()
            document.getElementById('capturedImage').src = rightImg
            document.getElementById('capturedImage').style.display = 'block';
            document.getElementById('container').style.display = 'none';
            videoStream.getTracks().forEach(track => track.stop());
        } else if (activeTab == 'rear' && rearImg !== '') {
            faceCarRear()
            document.getElementById('capturedImage').src = rearImg
            document.getElementById('capturedImage').style.display = 'block';
            document.getElementById('container').style.display = 'none';
            videoStream.getTracks().forEach(track => track.stop());
        } else if (activeTab == 'left' && leftImg !== '') {
            faceCarLeft()
            document.getElementById('capturedImage').src = leftImg
            document.getElementById('capturedImage').style.display = 'block';
            document.getElementById('container').style.display = 'none';
            videoStream.getTracks().forEach(track => track.stop());
        }

        if (activeTab == 'front' && frontImg == '') {
            faceCarFront()
            retake()
        } else if (activeTab == 'right' && rightImg == '') {
            faceCarRight()
            retake()
        } else if (activeTab == 'rear' && rearImg == '') {
            faceCarRear()
            retake()
        } else if (activeTab == 'left' && leftImg == '') {
            faceCarLeft()
            retake()
        }


        tabs.forEach(tab => {
            tab.classList.remove('selected-tab');
        });
        tab.classList.add('selected-tab');
    });
});


renderer.domElement.addEventListener('pointermove', () => {
    didModelMove = true

});