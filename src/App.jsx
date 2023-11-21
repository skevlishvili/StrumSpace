import React, { useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Outlines, Edges, useCursor } from "@react-three/drei";
import useSpline from "@splinetool/r3f-spline";
import * as THREE from "three";
import "./main.css";
import { useMediaQuery } from "usehooks-ts";

const fragmentShader = `
varying vec2 vUv;

void main() {
    vec3 colorTop = vec3(0.2, 0.2, 1); 
    vec3 colorBottom = vec3(0.2, 0.1, 0.6); 
    vec3 gradient = mix(colorBottom, colorTop, vUv.x);

    gl_FragColor = vec4(gradient, 1.0);
}


`;

const vertexShader = `



   uniform float time;
   uniform float amplitude;
   varying vec2 vUv;

   void main() {
    vUv = uv;


    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(modelPosition.z * 4.0 + time * 20.0) * amplitude * 0.2;
    
    
    
  
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
  
    gl_Position = projectedPosition;

    
  }
   
   
   
   `;

function GuitarString({ position, length = 290, audioPath }) {
  const [hovered, set] = useState();

  const [audioContext, setAudioContext] = useState(null);
  const [buffer, setBuffer] = useState(null);

  useEffect(() => {
    const context = new AudioContext();
    setAudioContext(context);

    fetch(audioPath)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
      .then((decodedBuffer) => {
        setBuffer(decodedBuffer);
      });

    return () => {
      context.close();
    };
  }, []);

  useCursor(hovered /*'pointer', 'auto', document.body*/);

  const uniforms = useMemo(
    () => ({
      time: {
        value: 0.0,
      },
      amplitude: {
        value: 0.0,
      },
    }),
    []
  );

  const [amplitude, setAmplitude] = useState(0);

  useFrame(({ clock }) => {
    if (hovered) {
      setAmplitude(1);
    } else if (amplitude > 0) {
      setAmplitude((prev) => Math.max(prev - 0.015, 0));
    }

    uniforms.amplitude.value = amplitude;
    uniforms.time.value = clock.getElapsedTime();
  });

  const playSound = () => {
    if (audioContext && buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  };

  const handleInteraction = () => {
    set(true);
    playSound();
  };

  const handleEndInteraction = () => {
    set(false);
  };

  return (
    <mesh
      position={position}
      rotation={[0, 0.03, 0]}
      onPointerOver={() => {
        set(true), playSound();
      }}
      onPointerOut={() => set(false)}
      onTouchStart={handleInteraction}
      onTouchEnd={handleEndInteraction}
    >
      <boxGeometry args={[0.2, 0.8, length, 10, 10, 300]} />

      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        castShadow
        receiveShadow
      />
    </mesh>
  );
}

function App({ ...props }) {
  const { nodes, materials } = useSpline(
    "https://prod.spline.design/GgV1zfjUc9luRxVu/scene.splinecode"
  );

  const matches = useMediaQuery("(min-width: 900px)");

  const [start, setStart] = useState(false);
  const [lock, setLock] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!start ? (
        <div className="start-overlay">
          <h2>Welcome To Strum Space!</h2>
          <button
            className="start-overlay-button"
            onClick={() => setStart((prevState) => !prevState)}
          >
            Start Playing
          </button>
        </div>
      ) : null}

      <button
        className="lock-button"
        onClick={() => setLock((prevState) => !prevState)}
      >
        {!lock ? "Adjust Guitar Position" : "Lock Guitar Position"}
      </button>

      <Canvas
        camera={{ position: matches ? [-200, 80, -90] : [-200, 80, -180] }}
      >
        <color attach="background" args={["#FFCC70"]} />

        <CameraControls enabled={lock} />

        <group rotation={matches ? [0, 0, 0] : [-0.9, 0.2, -0.4]}>
          <GuitarString
            position={[-22, -5, 25]}
            length={298}
            audioPath="1st_e.mp3"
          />
          <GuitarString
            position={[-22, -3, 30]}
            length={308}
            audioPath="2nd_B.mp3"
          />
          <GuitarString
            position={[-22, -1, 35]}
            length={310}
            audioPath="3rd_G.mp3"
          />
          <GuitarString
            position={[-22, 1, 35]}
            length={310}
            audioPath="4th_D.mp3"
          />
          <GuitarString
            position={[-22, 3, 30]}
            length={308}
            audioPath="5th_A.mp3"
          />
          <GuitarString
            position={[-22, 5, 25]}
            length={298}
            audioPath="6th_E.mp3"
          />

          <group {...props} dispose={null}>
            <scene name="Scene 1">
              <mesh
                name="Guitar"
                geometry={nodes.Guitar.geometry}
                material={materials["Guitar Material"]}
                castShadow
                receiveShadow
                position={[-3.53, 0, 36.22]}
              >
                <meshToonMaterial
                  color="orange"
                  transparent
                  castShadow
                  receiveShadow
                  side={THREE.DoubleSide}
                />

                <Outlines thickness={0.8} color="black" />

                <Edges scale={1} threshold={15} color="black" />
              </mesh>

              <spotLight
                name="Spot Light"
                castShadow
                intensity={1}
                angle={Math.PI / 6}
                distance={2000}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-fov={119.99999999999999}
                shadow-camera-near={100}
                shadow-camera-far={100000}
                position={[107, 446.51, -43]}
              ></spotLight>
              <directionalLight
                name="Directional Light"
                castShadow
                intensity={0.7}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-near={-10000}
                shadow-camera-far={100000}
                shadow-camera-left={-1000}
                shadow-camera-right={1000}
                shadow-camera-top={1000}
                shadow-camera-bottom={-1000}
                position={[200, 300, 300]}
              />

              {/* <OrthographicCamera
              name="1"
              makeDefault={true}
              far={10000}
              near={-50000}
            /> */}
              <hemisphereLight name="Default Ambient Light" intensity={0.75} />
            </scene>
          </group>
        </group>
      </Canvas>
    </div>
  );
}

export default App;
