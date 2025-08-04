export default {
  // Essential for GitHub Pages/Netlify
  base: './',
  
  // Build settings
  build: {
    outDir: 'dist'  // Output folder for production
  },

  // Three.js optimization (your original config)
  optimizeDeps: {
    exclude: [
      'three-mesh-bvh',
      'three/addons/renderers/webgl/nodes/WebGLNodes.js',
      'three-subdivide',
      'web-ifc-three',
      'web-ifc',
      'three-bvh-csg',
      'three-gpu-pathtracer',
      'flow',
      'three/addons/loaders/IFCLoader.js'
    ]
  },

  // Local development server
  server: {
    host: true,    // Enable network access
    port: 3000,    // Fixed port
    open: true     // Auto-open browser
  }
}