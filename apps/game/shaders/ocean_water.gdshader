shader_type canvas_item;

uniform float wave_speed : hint_range(0.05, 1.0) = 0.22;
uniform float wave_scale : hint_range(5.0, 40.0) = 18.0;
uniform float wave_intensity : hint_range(0.005, 0.08) = 0.022;
uniform vec4 shimmer_color : source_color = vec4(0.4, 0.88, 1.0, 1.0);

void fragment() {
    vec4 base_color = texture(TEXTURE, UV);
    
    // Dual-frequency gentle water caustics
    vec2 uv1 = UV * vec2(wave_scale, wave_scale * 0.6) + vec2(TIME * wave_speed * 0.3, TIME * wave_speed * 0.15);
    vec2 uv2 = UV * vec2(wave_scale * 0.8, wave_scale * 0.9) - vec2(TIME * wave_speed * 0.25, -TIME * wave_speed * 0.2);
    
    float w1 = sin(uv1.x * 2.0 + sin(uv1.y * 2.5));
    float w2 = cos(uv2.y * 2.2 + cos(uv2.x * 1.8));
    
    // Soft peak sparkle
    float caustic = max(0.0, (w1 + w2) * 0.5);
    caustic = pow(caustic, 3.5) * wave_intensity;
    
    // Add subtle shimmer to ocean surface
    COLOR = base_color + (shimmer_color * caustic);
}

