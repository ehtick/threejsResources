//  operations
//  some adapted from Inigo Quilez  https://iquilezles.org/articles/distfunctions/
//  .d distance     .c color, transparency
const SDF_operations = `

distCol opUnion(distCol dc1, distCol dc2) { 
  distCol dc;
  float d = min(dc1.d, dc2.d);
  vec4 c = d < dc2.d ? dc1.c : dc2.c; 
  dc.d = d;
  dc.c = c;     
  return dc;
}

distCol opSubtraction(distCol dc1, distCol dc2) { 
  distCol dc;
  float d = max(-dc1.d, dc2.d);
  vec4 c = d > dc2.d ? dc1.c : dc2.c; 
  dc.d = d;
  dc.c = c;     
  return dc;
}

distCol opIntersection(distCol dc1, distCol dc2){
  distCol dc;
  float d = max(dc1.d, dc2.d);
  vec4 c = d > dc2.d ? dc1.c : dc2.c;
  dc.d = d;
  dc.c = c;     
  return dc;
}

distCol opXor(distCol dc1, distCol dc2){
  distCol dc;
  float d1 = min(dc1.d, dc2.d);
  float d2 = max(dc1.d, dc2.d);
  float d = max(d1, -d2);
  //vec4 c = ( d1 < dc1.d ^^ d2 > dc2.d ) ?  dc2.c : dc1.c;
   vec4 c = d > dc2.d ? dc1.c : dc2.c; 
  dc.d = d;
  dc.c = c;     
  return dc;    
}

distCol opSmoothUnion( distCol dc1, distCol dc2, float k ){
  distCol dc;
  float h = clamp( 0.5 + 0.5*(dc2.d-dc1.d)/k, 0.0, 1.0 );
  float d = mix( dc2.d, dc1.d, h ) - k*h*(1.0-h);
  vec4 c = d < dc2.d ? dc1.c : dc2.c; 
  dc.d = d;
  dc.c = c;     
  return dc;
}

distCol opSmoothSubtraction( distCol dc1, distCol dc2, float k ){
  distCol dc;
  float h = clamp( 0.5 - 0.5*(dc2.d+dc1.d)/k, 0.0, 1.0 );
  float d = mix( dc2.d, -dc1.d, h ) + k*h*(1.0-h);
  vec4 c = d > dc2.d ? dc1.c : dc2.c; 
  dc.d = d;
  dc.c = c;     
  return dc;
}

distCol opSmoothIntersection( distCol dc1, distCol dc2, float k ){
  distCol dc;
  float h = clamp( 0.5 - 0.5*(dc2.d-dc1.d)/k, 0.0, 1.0 );
  float d = mix( dc2.d, dc1.d, h ) + k*h*(1.0-h);
  vec4 c = d > dc2.d ? dc1.c : dc2.c;
  dc.d = d;
  dc.c = c;     
  return dc;
}
 
vec4 opElongate( vec3 p, vec3 h) {
    //return vec4( p-clamp(p,-h,h), 0.0 ); // faster, but produces zero in the interior elongated box
    
    vec3 q = abs(p)-h;
    return vec4( max(q,0.0), min(max(q.x,max(q.y,q.z)),0.0) );
}

vec3 opLimitedRepetition(vec3 p, float s, in vec3 n)
{
    vec3 q = p - s*clamp(round(p/s),-n,n);
    return q;
} 

vec3 opCheapBend(vec3 p, float k)
{
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return q;
}
 
float opDisplaceSin(vec3 p, float displace)
{
    return sin(displace*p.x)*sin(displace*p.y)*sin(displace*p.z);
    
}

float opRound( float sdf3d, float rad )
{
    return sdf3d - rad;
}

float opOnion( float d,  float h )
{
    return abs(d)-h;
}
//..........................................................

// operations for 2D SDFs 
 
float opExtrusion(vec3 p, float sdf2D, float h)
{
    vec2 w = vec2( sdf2D, abs(p.z) - h );
  	return min(max(w.x,w.y),0.0) + length(max(w,0.0));
}

vec2 opRevolution( vec3 p, float w )
{
    return vec2( length(p.xz) - w, p.y );
}

//..................................................................


vec3 getNormal(vec3 p) {   // Note:   different from GetNormal in shaderParts.js
    vec2 e5 = vec2(1e-5, 0); // 
    float d1 = (p-e5.xyy).x;
    float d2 = (p-e5.yxy).y;
    float d3 = (p-e5.yyx).z;
    vec3 n = normalize(vec3(d1, d2, d3));
    return n;
}

//..................................................................

// rotations, translations, mirroring 

vec3 rotateX(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(
        p.x,
        p.y * c - p.z * s,
        p.y * s + p.z * c
    );
}

vec3 rotateXPivot(vec3 p, float angle, vec3 pivot) {
    p -= pivot;
    float s = sin(angle);
    float c = cos(angle);
    vec3 rotated = vec3(
        p.x,
        p.y * c - p.z * s,
        p.y * s + p.z * c
        );
    return rotated + pivot;
}

vec3 rotateY(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(
        p.x * c + p.z * s,
        p.y,
        -p.x * s + p.z * c
    );
}

vec3 rotateYPivot(vec3 p, float angle, vec3 pivot) {
    p -= pivot;
    float s = sin(angle);
    float c = cos(angle);
    vec3 rotated = vec3(
        p.x * c + p.z * s,
        p.y,
        -p.x * s + p.z * c
        );
    return rotated + pivot;
}

vec3 rotateZ(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(
        p.x * c - p.y * s,
        p.x * s + p.y * c,
        p.z
    );
}

vec3 rotateZPivot(vec3 p, float angle, vec3 pivot) {
    p -= pivot;
    float s = sin(angle);
    float c = cos(angle);
    vec3 rotated = vec3(
        p.x * c - p.y * s,
        p.x * s + p.y * c,
        p.z
        );
    return rotated + pivot;
}

vec3 translateX(vec3 p, float x) {
    return p - vec3(x, 0.0, 0.0);
}

 vec3 translateY(vec3 p, float y) {
    return p - vec3(0.0, y, 0.0);
}

vec3 translateZ(vec3 p, float z) {
    return p - vec3(0.0, 0.0, z);
}

vec3 translateXYZ(vec3 p, vec3 q) {
    return p - q;
}

vec3 mirrorYZ(vec3 p) {
    return vec3(-p.x, p.y, p.z);
}

vec3 mirrorXZ(vec3 p) {
    return vec3(p.x, -p.y, p.z);
}

vec3 mirrorXY(vec3 p) {
    return vec3(p.x, p.y, -p.z);
}

 `;
  
export { SDF_operations }

