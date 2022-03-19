/* - set up first person camera & movement
// - Set up Outer cube ring W/ mesh deformation
// - Set up Sphere array with random positions & movements
// - Add colour changing 
// - Add customizable User Interaction screens
*/ 

	//Misc Visualizer Setup
	{
	//deals with the window being resized
		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}
	//Noise used in mesh Distortion
		var noise = new SimplexNoise();
	//loads the visualizer
		window.onload = visualizerInitializer();
		document.body.addEventListener('touchend', function(ev) { context.resume(); });
	}

	//visualizer initializer rhymes lol
	function visualizerInitializer(){

		//HTML Audio Management stuff
		{
			//import the audio files
			var file = document.getElementById("thefile");
			var audio = document.getElementById("audio");
			var fileLabel = document.querySelector("label.file");

			//playes the audio file on page load
			document.onload = function(e){
				console.log(e);
				audio.play();
				initializer();
			}
			//plays the audio file if file changed 
			//(so you dont have to reload the page to change songs)
			file.onchange = function(){
				fileLabel.classList.add('normal');
				audio.classList.add('active');
				var files = this.files;
				audio.src = URL.createObjectURL(files[0]);
				audio.load();
				audio.play();
				initializer();
			}

		}

		function initializer() {

			//Establish Audio Nodes & Tools
			{
				
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
				//var group = new THREE.Group();
			}

			//Create All Scene Items
			{
				//Create Camera & Scene
				{
					var scene = new THREE.Scene();
					var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
					camera.position.set(0,0,100);
					camera.lookAt(scene.position);
				}

				//Create Renderer
				{
					var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
					renderer.setSize(window.innerWidth, window.innerHeight);
				}

				//Create Plane Geometry
				{
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
				}

				//Create Cube Geomtery
				{
					var boxGeometry = new THREE.BoxGeometry(10,10,10);
					var boxMaterial = new THREE.MeshBasicMaterial();
					boxMaterial.color = new THREE.Color(0, 1, 0);
					boxMaterial.wireframe = true;
					var box = new THREE.Mesh(boxGeometry, boxMaterial);
					box.position.set(0, 0, 0);
					
				}

				//Create Sphere Geometry
				{
					var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 3);
					var ballMaterial = new THREE.MeshLambertMaterial({
						color: 0xff00ee,
						wireframe: true
					});
					var ball = new THREE.Mesh(icosahedronGeometry, ballMaterial);
					ball.position.set(0, 0, 0);
				}
				
				//Create Lights
				{
					var ambientLight = new THREE.AmbientLight(0xaaaaaa);
					var spotLight = new THREE.SpotLight(0xffffff);
					spotLight.intensity = 0.9;
					spotLight.position.set(-10, 40, 20);
					spotLight.lookAt(ball);
					spotLight.castShadow = true;
				}
			}

			//Add everything to scene
			{
				scene.add(camera);
				scene.add(ambientLight);
				scene.add(spotLight);
				scene.add(plane);
				scene.add(ball);
				scene.add(box);
				//scene.add(group);
			}

			document.getElementById('out').appendChild(renderer.domElement);
			window.addEventListener('resize', onWindowResize, false);

			

			//does all the animation & frame dependent Calculations
			//tried to call it 'visuallizer' but stuff kept breaking so i gave up
			function render() {

				//Seperates Frequency Data into lowest - highest + averages
				{
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
				}
				
				//Adds Mesh Distortion
				{
					distortPlane(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
					//distortMesh(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
					distortBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
				}
		
				//Sphere Rotation & Associated Variables
				{
					var ballRotSpd = (overallAvg/10000)+0.005

					ball.rotation.x += ballRotSpd
					ball.rotation.y += ballRotSpd
					ball.rotation.z += ballRotSpd
					//group.rotation.y += 0.005;
					//controls.update();
				}

				//controls.update();

				renderer.render(scene, camera);
				requestAnimationFrame(render);
			}
			render();
			
		}
	}

	//Mesh Distortion Functions
	{
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
	}

	//Misc Calculation Functions
	{
		//like, does fractions, man
		function fractionate(val, minVal, maxVal) {
			return (val - minVal)/(maxVal - minVal);
		}
		//returns changes in volume and Frequency
		function modulate(val, minVal, maxVal, outMin, outMax) {
			var fr = fractionate(val, minVal, maxVal);
			var delta = outMax - outMin;
			return outMin + (fr * delta);
		}
		//Returns Average of audio frequencies
		function avg(arr){
			var total = arr.reduce(function(sum, b) { return sum + b; });
			return (total / arr.length);
		}
		//Returns maximum of each frequency
		function max(arr){
			return arr.reduce(function(a, b){ return Math.max(a, b); })
		}
	}