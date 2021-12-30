import { useRef, useEffect, useCallback } from 'react';
import * as Three from 'three';
import { Button, Form, Input } from 'antd';
import styles from './login.less';

const amountX = 50;
const amountY = 50;
const color = '#097bdb';
const top = 350;
const SEPARATION = 100;

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const LoginPage: React.FC = () => {
  const ref = useRef<any>(null);
  const rendererRef = useRef<Three.WebGLRenderer | null>(null);
  const cameraRef = useRef<Three.PerspectiveCamera | null>(null);
  const particlesRef = useRef<Three.Points | null>(null);
  const sceneRef = useRef<Three.Scene | null>(null);
  const count = useRef(0);
  const mouseX = useRef(0);
  const windowHalfX = useRef(window.innerWidth / 2);

  const init = useCallback(() => {
    // 初始化镜头
    const camera = new Three.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
    camera.position.z = 1000;
    cameraRef.current = camera;

    const numParticles = amountX * amountY;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);
    // 初始化粒子位置和大小
    let i = 0;
    let j = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        positions[i] = ix * SEPARATION - (amountX * SEPARATION) / 2;
        positions[i + 1] = 0;
        positions[i + 2] = iy * SEPARATION - (amountY * SEPARATION) / 2;
        scales[j] = 1;
        i += 3;
        j++;
      }
    }
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new Three.BufferAttribute(scales, 1));

    // 初始化粒子材质
    const material = new Three.ShaderMaterial({
      uniforms: {
        color: { value: new Three.Color(color) },
      },
      vertexShader: `
        attribute float scale;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4( position, 2.0 );
          gl_PointSize = scale * ( 300.0 / - mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
          gl_FragColor = vec4( color, 1.0 );
        }
      `,
    });

    particlesRef.current = new Three.Points(geometry, material);

    // 初始化场景
    sceneRef.current = new Three.Scene();
    sceneRef.current.add(particlesRef.current);

    // 初始化渲染器
    const renderer = new Three.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(ref.current!.offsetWidth, ref.current!.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearAlpha(0);
    rendererRef.current = renderer;
    ref.current!.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, { passive: false });
    document.addEventListener('mousemove', onDocumentMouseMove, { passive: false });
    document.addEventListener('touchstart', onDocumentTouchStart, { passive: false });
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
  }, []);

  const render = () => {
    if (cameraRef.current && sceneRef.current && particlesRef.current && rendererRef.current) {
      cameraRef.current.position.x += (mouseX.current - cameraRef.current.position.x) * 0.05;
      cameraRef.current.position.y = 400;
      cameraRef.current.lookAt(sceneRef.current.position);
      const positions = particlesRef.current.geometry.attributes.position.array as any[];
      const scales = particlesRef.current.geometry.attributes.scale.array as any[];

      // 计算粒子位置及大小
      let i = 0;
      let j = 0;
      for (let ix = 0; ix < amountX; ix++) {
        for (let iy = 0; iy < amountY; iy++) {
          positions[i + 1] = Math.sin((ix + count.current) * 0.3) * 100 + Math.sin((iy + count.current) * 0.5) * 100;
          scales[j] = (Math.sin((ix + count.current) * 0.3) + 1) * 8 + (Math.sin((iy + count.current) * 0.5) + 1) * 8;
          i += 3;
          j++;
        }
      }
      // 重新渲染粒子
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.scale.needsUpdate = true;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      count.current += 0.1;
    }
  };

  const animate = useCallback(() => {
    requestAnimationFrame(animate);
    render();
  }, []);

  useEffect(() => {
    init();
    animate();
  }, [animate, init]);

  useEffect(() => {
    return () => {
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      document.removeEventListener('touchstart', onDocumentTouchStart);
      document.removeEventListener('touchmove', onDocumentTouchMove);
    };
  }, []);

  function onWindowResize() {
    windowHalfX.current = window.innerWidth / 2;
    if (cameraRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    }
    cameraRef.current?.updateProjectionMatrix();
    rendererRef.current?.setSize(window.innerWidth, SCREEN_HEIGHT - top);
  }

  function onDocumentMouseMove(event: MouseEvent) {
    mouseX.current = event.clientX - windowHalfX.current;
  }

  function onDocumentTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      mouseX.current = event.touches[0].pageX - windowHalfX.current;
    }
  }

  function onDocumentTouchMove(event: TouchEvent) {
    if (event.touches.length === 1) {
      event.preventDefault();
      mouseX.current = event.touches[0].pageX - windowHalfX.current;
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.gifContainer} ref={ref} style={{ top, height: SCREEN_HEIGHT - top }}></div>
      <div className={styles.loginBox}>
        <Form>
          <Form.Item>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item>
            <Input placeholder="请输入密码" type="password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block>登录</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
