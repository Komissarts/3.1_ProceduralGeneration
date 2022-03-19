var noise = new SimplexNoise();
var vizInit = function (){

	
//import the audio files
var file = document.getElementById("thefile");
var audio = document.getElementById("audio");
var fileLabel = document.querySelector("label.file");


//playes the audio file on page load
document.onload = function(e){
	console.log(e);
	audio.play();
	play();
}

file.onchange = function(){
	fileLabel.classList.add('normal');
	audio.classList.add('active');
	var files = this.files;
	
	audio.src = URL.createObjectURL(files[0]);
	audio.load();
	audio.play();
	play();
}





function play() {
//AudioContext() is a linked list of Audio nodes that contains audio data
	var context = new AudioContext();
//creates an AudioSource node that can be used to manipulate audio data
	var src = context.createMediaElementSource(audio);
//creates an Analyser node that allows us to read audio data
	var analyser = context.createAnalyser();
//allows rw access to the audio files
	src.connect(analyser);
	analyser.connect(context.destination);
//sample size used when performing Fourier Transform to get frequency Data
	analyser.fftSize = 2048;
//readonly integer, only half of analyser.fftSize. it is the amoount of data
//values availble for any music visualizations
	var bufferLength = analyser.frequencyBinCount;
//standard 8-bit integers, holds the values of bufferLength for future use
	var dataArray = new Uint8Array(bufferLength);
	var scene = new THREE.Scene();
//var group = new THREE.Group();


//Establish Camera & Parameters
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0,0,100);
	camera.lookAt(scene.position);
	scene.add(camera);



	var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);




//establish plane geometries & Meshes
	var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
	var planeMaterial = new THREE.MeshLambertMaterial({
		color: 0x68228b,
		side: THREE.DoubleSide,
		wireframe: true
	});
	var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotation.x = -0.5 * Math.PI;
	plane.position.set(0, -30, 0);
	//group.add(plane);

//retreive global position & then apply mesh distorition.

//create box geometry ring around map
/*
	var boxGeometry = new THREE.boxGeometry(1,1,1);
	var boxMaterial = new THREE.MeshLambertMaterial({
		color: 0x68228b,
		wireframe: true
	});
	var rect = new THREE.Mesh(boxGeometry, boxMaterial);
	rect.position.set(0, 0, 0);
	*/

//icosahedron sphere detail determined by user/ randomized placement location
//creates ball variable with icosahedron mesh and default lambert material
	var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 3);
	var ballMaterial = new THREE.MeshLambertMaterial({
		color: 0xff00ee,
		wireframe: true
	});
	var ball = new THREE.Mesh(icosahedronGeometry, ballMaterial);
	ball.position.set(0, 0, 0);
	//group.add(ball);

	var ambientLight = new THREE.AmbientLight(0xaaaaaa);
	scene.add(ambientLight);

	var spotLight = new THREE.SpotLight(0xffffff);
	spotLight.intensity = 0.9;
	spotLight.position.set(-10, 40, 20);
	spotLight.lookAt(ball);
	spotLight.castShadow = true;
	scene.add(spotLight);

	scene.add(plane);
	scene.add(ball);
	//scene.add(rect);
	
	//scene.add(group);

	document.getElementById('out').appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);





	
//does all the animation/renders
	var render = function() {
//gets frequency data every frame and sorts it to lowest, average and highest frequency
		analyser.getByteFrequencyData(dataArray);
		var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
		var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);
		var overallAvg = avg(dataArray);
		var lowerMax = max(lowerHalfArray);
		var lowerAvg = avg(lowerHalfArray);
		var upperMax = max(upperHalfArray);
		var upperAvg = avg(upperHalfArray);
		var lowerMaxFr = lowerMax / lowerHalfArray.length;
		var lowerAvgFr = lowerAvg / lowerHalfArray.length;
		var upperMaxFr = upperMax / upperHalfArray.length;
		var upperAvgFr = upperAvg / upperHalfArray.length;

//Distort the meshes
		distortPlane(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
		//distortMesh(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
		
		distortBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

		var ballRotSpd = (overallAvg/10000)+0.005

//add rotation
		ball.rotation.x += ballRotSpd
		ball.rotation.y += ballRotSpd
		ball.rotation.z += ballRotSpd
		//group.rotation.y += 0.005;
		//controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	};

	requestAnimationFrame(render);
	render();

	//deals with the window being resized
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	//distorts the ball mesh with bass and treble data from audio file
	function distortBall(mesh, bassFr, treFr) {
		mesh.geometry.vertices.forEach(function (vertex, i) {
			var offset = mesh.geometry.parameters.radius;
			var amp = 7;
			var time = window.performance.now();
			vertex.normalize();
			var rf = 0.00001;
			var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
			vertex.multiplyScalar(distance);
		});
		mesh.geometry.verticesNeedUpdate = true;
		mesh.geometry.normalsNeedUpdate = true;
		mesh.geometry.computeVertexNormals();
		mesh.geometry.computeFaceNormals();
	}

	function distortPlane(mesh, distortionFr) {
		mesh.geometry.vertices.forEach(function (vertex, i) {
			var amp = 5;
			var time = Date.now();
			var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
			vertex.z = distance;
		});
		mesh.geometry.verticesNeedUpdate = true;
		mesh.geometry.normalsNeedUpdate = true;
		mesh.geometry.computeVertexNormals();
		mesh.geometry.computeFaceNormals();
	}
	audio.play();
};
}

window.onload = vizInit();
document.body.addEventListener('touchend', function(ev) { context.resume(); });




function fractionate(val, minVal, maxVal) {
	return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
	var fr = fractionate(val, minVal, maxVal);
	var delta = outMax - outMin;
	return outMin + (fr * delta);
}

function avg(arr){
	var total = arr.reduce(function(sum, b) { return sum + b; });
	return (total / arr.length);
}

function max(arr){
	return arr.reduce(function(a, b){ return Math.max(a, b); })
}