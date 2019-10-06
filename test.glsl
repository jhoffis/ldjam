
#version 300 es

precision mediump float;
uniform sampler2D u_image;
out vec2 v_texCoord;

void main(){
    gl_FragColor = texture2D(u_image, v_texCoord);
}