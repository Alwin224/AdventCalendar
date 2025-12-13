uniform sampler2D uPerlinTexture;
varying vec2 vUv; 
uniform float uTime;
void main(){

vec4 textureColor = texture2D(uPerlinTexture, vUv);


vec3 auroraColor = vec3(0.305, 0.95, 0.58);
float noise = textureColor.r;
vec3 finalColor = noise * auroraColor;

//make the edges fade through transparency 
float edgeFadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
float edgeFadeY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
float edgeFade = edgeFadeX * edgeFadeY;

//final color with the edges included
gl_FragColor = vec4(finalColor, edgeFade * noise *noise *noise); 
   
}