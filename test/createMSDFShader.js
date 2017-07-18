module.exports = function createMSDFShader(opt) {
  const { fgColor, bgColor, msdf, precision } = opt || {};
  

  return {
    uniforms: {
      msdf: { type: "t", value: msdf || new THREE.Texture() },
      bgColor: { type: "v4", value: fgColor || new THREE.Vector4() },
      fgColor: { type: "v4", value: bgColor || new THREE.Vector4() }
    },
    vertexShader: `
      attribute vec2 uv;
      attribute vec4 position;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * position;
      }
    `,
    fragmentShader: `
      #ifdef GL_OES_standard_derivatives
        #extension GL_OES_standard_derivatives : enable
      #endif
      precision ${precision || 'highp'} float;
      uniform sampler2D msdf;
      uniform vec4 bgColor;
      uniform vec4 fgColor;

      varying vec2 vUv;

      float median(float r, float g, float b) {
        return max(min(r, g), min(max(r, g), b));
      }

      void main() {
        vec3 sample = texture2D(msdf, vUv).rgb;
        float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
        float opacity = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);
        gl_FragColor = mix(fgColor, bgColor, opacity);
      }`
  };
};
