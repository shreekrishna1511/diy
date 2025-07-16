from flask import Flask, request, jsonify
import numpy as np
import os

app = Flask(__name__)

def naca4_airfoil(m, p, t, c=1.0, n_points=100):
    x = np.linspace(0, c, n_points)
    yt = 5 * t * c * (0.2969*np.sqrt(x/c) - 0.1260*(x/c) - 0.3516*(x/c)**2 + 0.2843*(x/c)**3 - 0.1015*(x/c)**4)
    yc = np.zeros_like(x)
    dyc_dx = np.zeros_like(x)
    for i in range(n_points):
        xi = x[i]
        if xi < p*c:
            yc[i] = (m/(p**2)) * (2*p*(xi/c) - (xi/c)**2) * c
            dyc_dx[i] = 2*m/(p**2) * (p - xi/c)
        else:
            yc[i] = (m/((1-p)**2)) * ((1 - 2*p) + 2*p*(xi/c) - (xi/c)**2) * c
            dyc_dx[i] = 2*m/((1-p)**2) * (p - xi/c)
    theta = np.arctan(dyc_dx)
    xu = x - yt * np.sin(theta)
    yu = yc + yt * np.cos(theta)
    xl = x + yt * np.sin(theta)
    yl = yc - yt * np.cos(theta)
    upper = np.vstack((xu[::-1], yu[::-1])).T
    lower = np.vstack((xl[1:], yl[1:])).T
    coords = np.vstack((upper, lower))
    return coords

def generate_gcode(coords, feed_rate=1000):
    gcode = []
    gcode.append("G21 ; Set units to mm")
    gcode.append("G90 ; Absolute positioning")
    gcode.append("G1 F{} ; Feed rate".format(feed_rate))
    start = coords[0]
    gcode.append(f"G0 X{start[0]:.4f} Y{start[1]:.4f}")
    for point in coords[1:]:
        gcode.append(f"G1 X{point[0]:.4f} Y{point[1]:.4f}")
    gcode.append(f"G1 X{start[0]:.4f} Y{start[1]:.4f}")
    gcode.append("M30 ; End program")
    return "\n".join(gcode)

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    naca = data.get('naca', '0012')
    chord = float(data.get('chord', 100))
    n_points = int(data.get('points', 100))
    if len(naca) != 4 or not naca.isdigit():
        return jsonify({'error': 'Invalid NACA format'}), 400
    m = int(naca[0]) / 100.0
    p = int(naca[1]) / 10.0
    t = int(naca[2:]) / 100.0
    coords = naca4_airfoil(m, p, t, c=chord, n_points=n_points)
    gcode = generate_gcode(coords)
    coords_list = coords.tolist()
    return jsonify({'coords': coords_list, 'gcode': gcode})

# ✅ Modified for Render deployment
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
