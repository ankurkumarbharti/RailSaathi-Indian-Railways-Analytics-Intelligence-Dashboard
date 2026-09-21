#!/usr/bin/env python3
import http.server
import socketserver
import urllib.parse as urlparse
import json
import math
import sys
import os

PORT = 8000

# Historical dataset duplicated from data.js for server-side calculations
HISTORICAL_DATA = {
    "years": [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    
    "passengers": {
        "total": [7203, 7627, 8090, 8421, 8421, 8397, 8107, 8231, 8284, 8439, 8089, 1252, 4768, 6670, 7440, 7500],
        "upperClass": [380, 405, 435, 468, 472, 480, 462, 472, 484, 498, 481, 148, 325, 455, 510, 525],
        "sleeperClass": [2350, 2490, 2640, 2750, 2755, 2745, 2647, 2685, 2710, 2760, 2648, 813, 1556, 2178, 2432, 2455],
        "secondClass": [4473, 4732, 5015, 5203, 5194, 5172, 4998, 5074, 5090, 5181, 4960, 291, 2887, 4037, 4498, 4520],
        "passengerKm": [838, 903, 979, 1047, 1083, 1147, 1143, 1155, 1149, 1209, 1162, 188, 700, 1187, 1370, 1410]
    },
    
    "revenue": {
        "passenger": [26003, 28756, 32918, 36058, 40005, 43503, 40800, 42100, 46105, 50672, 53087, 16640, 31122, 54000, 65000, 68000],
        "freight": [54500, 62832, 72153, 79400, 84900, 94174, 101300, 107660, 115998, 126674, 136991, 118454, 131000, 150000, 165000, 178000],
        "other": [2800, 3100, 3500, 4000, 4500, 5000, 5200, 5500, 6100, 6950, 7730, 6500, 7200, 8500, 9800, 11500],
        "total": [83303, 94688, 108571, 119458, 129405, 142677, 147300, 155260, 168203, 184296, 197808, 141594, 169322, 212500, 239800, 257500],
        "operatingRatio": [95.3, 94.1, 90.4, 88.5, 90.2, 91.8, 107.4, 96.5, 97.0, 98.5, 97.3, 176.3, 131.5, 98.8, 95.3, 98.4]
    },
    
    "freight": {
        "total": [791, 857, 921, 975, 1015, 1051, 1101, 1109, 1160, 1160, 1210, 1070, 1226, 1418, 1510, 1588],
        "coal": [378, 411, 443, 467, 491, 511, 535, 537, 558, 553, 573, 508, 581, 668, 715, 758],
        "foodGrains": [55, 58, 63, 67, 69, 71, 73, 71, 73, 79, 81, 72, 81, 92, 96, 101],
        "iron": [92, 100, 107, 114, 118, 121, 126, 127, 133, 133, 138, 121, 140, 163, 170, 182],
        "cement": [71, 76, 82, 87, 90, 94, 98, 99, 104, 104, 108, 95, 110, 127, 135, 142],
        "fertilizer": [48, 52, 56, 60, 62, 65, 68, 68, 71, 74, 74, 65, 75, 87, 92, 97],
        "petroleum": [38, 41, 45, 47, 49, 51, 53, 54, 57, 60, 60, 52, 61, 70, 74, 79],
        "containers": [41, 45, 49, 52, 54, 57, 60, 61, 64, 64, 67, 58, 68, 78, 83, 88],
        "others": [68, 74, 76, 81, 82, 81, 88, 92, 100, 93, 109, 99, 110, 133, 145, 141],
        "netTonneKm": [630, 682, 727, 775, 808, 847, 882, 893, 920, 921, 976, 863, 946, 1089, 1170, 1192]
    },
    
    "accidents": {
        "total": [141, 136, 130, 118, 117, 118, 107, 96, 94, 73, 79, 48, 43, 35, 40, 33],
        "collisions": [28, 25, 23, 20, 19, 18, 15, 13, 12, 9, 10, 6, 5, 4, 5, 4],
        "derailments": [84, 82, 78, 71, 72, 74, 65, 58, 58, 45, 49, 29, 27, 22, 25, 20],
        "levelCrossing": [18, 17, 17, 15, 14, 14, 14, 13, 13, 10, 11, 7, 6, 5, 6, 5],
        "fires": [8, 9, 9, 9, 9, 9, 10, 9, 8, 6, 7, 4, 4, 3, 3, 3],
        "others": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1],
        "casualties": [390, 360, 340, 295, 280, 270, 230, 195, 190, 145, 160, 95, 87, 71, 80, 62]
    },
    
    "punctuality": {
        "overall": [74.5, 75.2, 76.3, 74.9, 76.2, 78.5, 76.9, 77.4, 77.0, 71.4, 73.2, 86.5, 85.2, 82.4, 83.8, 87.3],
        "mail": [72.0, 72.8, 74.0, 72.5, 74.0, 76.5, 74.8, 75.3, 75.0, 69.5, 71.4, 84.8, 83.5, 80.8, 82.2, 86.0],
        "express": [76.5, 77.3, 78.5, 77.0, 78.5, 80.8, 79.2, 79.8, 79.4, 73.8, 75.6, 88.2, 87.0, 84.0, 85.4, 88.6],
        "vande": [None, None, None, None, None, None, None, None, None, None, 94.0, 87.0, 89.0, 90.2, 91.8, 93.5],
        "cancellations": [11000, 10500, 10200, 10800, 10500, 10200, 11500, 12000, 12500, 15000, 14800, 8200, 9500, 13200, 11800, 9900],
        "avgDelayMin": [48, 45, 44, 46, 43, 40, 42, 41, 42, 51, 48, 28, 30, 36, 32, 27]
    },
    
    "infrastructure": {
        "routeKm": [64015, 64600, 64600, 65808, 65436, 66687, 66687, 67368, 67415, 68525, 68443, 68525, 68584, 68584, 68702, 68726],
        "electrifiedKm": [18274, 19000, 20884, 22224, 23541, 25367, 27999, 30802, 33977, 39399, 45881, 51235, 58000, 63000, 65141, 68000],
        "bridges": [145800, 146000, 146100, 146400, 146600, 146800, 147000, 147200, 147500, 147800, 148000, 148500, 149000, 149500, 150000, 151000],
        "stations": [7083, 7100, 7133, 7172, 7172, 7180, 7216, 7253, 7321, 7349, 7349, 7350, 7325, 7349, 7349, 7349],
        "levelCrossings": [31836, 31000, 30000, 29000, 28000, 27000, 26000, 25000, 23000, 21000, 18858, 16776, 14805, 12889, 11213, 9500]
    },
    
    "rollingStock": {
        "locomotives": [9549, 9726, 9802, 9904, 10036, 10252, 10467, 10728, 11088, 11452, 11991, 12729, 13165, 14028, 14748, 15400],
        "electricLocos": [4902, 5059, 5176, 5310, 5478, 5674, 5891, 6159, 6529, 6939, 7558, 8283, 8876, 9745, 10500, 11200],
        "coaches": [51400, 52000, 53000, 54000, 55000, 56000, 57000, 58000, 60000, 63000, 67000, 70000, 73000, 76000, 78000, 80000],
        "wagons": [222147, 225000, 230000, 235000, 242000, 248000, 257000, 264000, 277000, 290000, 296000, 304000, 314000, 330000, 340000, 352000]
    },
    
    "employees": {
        "total": [1395892, 1370432, 1345200, 1327090, 1307236, 1305064, 1292000, 1309282, 1275194, 1264736, 1227438, 1229632, 1216067, 1208219, 1200000, 1150000]
    },
    
    "premiumTrains": {
        "vandeBharat": [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 8, 10, 34, 102, 136]
    }
}

def get_nested_property(obj, path):
    parts = path.split('.')
    cur = obj
    for part in parts:
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur

class StatsEngine:
    @staticmethod
    def mean(arr):
        if not arr: return 0
        return sum(arr) / len(arr)

    @staticmethod
    def median(arr):
        if not arr: return 0
        sorted_arr = sorted(arr)
        n = len(sorted_arr)
        mid = n // 2
        return sorted_arr[mid] if n % 2 != 0 else (sorted_arr[mid-1] + sorted_arr[mid]) / 2.0

    @staticmethod
    def std_dev(arr, is_sample=True):
        n = len(arr)
        if n <= 1: return 0
        avg = StatsEngine.mean(arr)
        sq_diffs = sum((v - avg) ** 2 for v in arr)
        return math.sqrt(sq_diffs / (n - (1 if is_sample else 0)))

    @staticmethod
    def cagr(start_val, end_val, periods):
        if start_val <= 0 or end_val <= 0 or periods <= 0: return 0
        return (math.pow(end_val / start_val, 1.0 / periods) - 1.0) * 100.0

    @staticmethod
    def pearson_correlation(x, y):
        n = len(x)
        if n == 0 or n != len(y): return 0
        mean_x = StatsEngine.mean(x)
        mean_y = StatsEngine.mean(y)
        num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        den_x = sum((xi - mean_x) ** 2 for xi in x)
        den_y = sum((yi - mean_y) ** 2 for yi in y)
        if den_x == 0 or den_y == 0: return 0
        return num / math.sqrt(den_x * den_y)

    @staticmethod
    def linear_regression(x, y):
        n = len(x)
        if n == 0 or n != len(y): return {"m": 0, "c": 0, "r2": 0}
        mean_x = StatsEngine.mean(x)
        mean_y = StatsEngine.mean(y)
        num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        den = sum((xi - mean_x) ** 2 for xi in x)
        m = num / den if den != 0 else 0
        c = mean_y - m * mean_x
        
        ss_tot = sum((yi - mean_y) ** 2 for yi in y)
        ss_res = sum((yi - (m * xi + c)) ** 2 for xi, yi in zip(x, y))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot != 0 else 0.0
        
        return {"m": m, "c": c, "r2": r2}

class CustomAPIRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow Cross-Origin Resource Sharing (CORS) for development ease
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse.urlparse(self.path)
        path = parsed_url.path
        query = urlparse.parse_qs(parsed_url.query)

        if path == '/api/health':
            self.send_json({"status": "ok", "backend": "python"})
        elif path == '/api/correlation':
            self.handle_correlation_api(query)
        elif path == '/api/simulate':
            self.handle_simulate_api(query)
        else:
            # Fall back to serving static files
            super().do_GET()

    def send_json(self, data, status=200):
        try:
            json_bytes = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(json_bytes))
            self.end_headers()
            self.wfile.write(json_bytes)
        except Exception as e:
            print(f"Error serving JSON: {e}", file=sys.stderr)

    def handle_correlation_api(self, query):
        x_path = query.get('x', [None])[0]
        y_path = query.get('y', [None])[0]

        if not x_path or not y_path:
            self.send_json({"error": "Missing parameters 'x' or 'y'"}, 400)
            return

        x_raw = get_nested_property(HISTORICAL_DATA, x_path)
        y_raw = get_nested_property(HISTORICAL_DATA, y_path)

        if x_raw is None or y_raw is None:
            self.send_json({"error": f"Invalid variables: x={x_path}, y={y_path}"}, 400)
            return

        # Align variables (skipping indices that are None/null)
        years = HISTORICAL_DATA["years"]
        aligned_points = []
        for i in range(len(years)):
            if i < len(x_raw) and i < len(y_raw):
                if x_raw[i] is not None and y_raw[i] is not None:
                    aligned_points.append({
                        "year": years[i],
                        "x": x_raw[i],
                        "y": y_raw[i]
                    })

        if len(aligned_points) < 2:
            self.send_json({"error": "Insufficient data points for analysis"}, 400)
            return

        x_vals = [p["x"] for p in aligned_points]
        y_vals = [p["y"] for p in aligned_points]

        r = StatsEngine.pearson_correlation(x_vals, y_vals)
        reg = StatsEngine.linear_regression(x_vals, y_vals)

        # Descriptive Statistics
        x_mean = StatsEngine.mean(x_vals)
        x_median = StatsEngine.median(x_vals)
        x_sd = StatsEngine.std_dev(x_vals)
        x_cv = (x_sd / x_mean * 100.0) if x_mean != 0 else 0.0
        x_cagr = StatsEngine.cagr(x_vals[0], x_vals[-1], len(x_vals) - 1)

        y_mean = StatsEngine.mean(y_vals)
        y_median = StatsEngine.median(y_vals)
        y_sd = StatsEngine.std_dev(y_vals)
        y_cv = (y_sd / y_mean * 100.0) if y_mean != 0 else 0.0
        y_cagr = StatsEngine.cagr(y_vals[0], y_vals[-1], len(y_vals) - 1)

        response_data = {
            "r": r,
            "m": reg["m"],
            "c": reg["c"],
            "r2": reg["r2"],
            "descriptive": {
                "x": {
                    "mean": x_mean,
                    "median": x_median,
                    "sd": x_sd,
                    "cv": x_cv,
                    "cagr": x_cagr
                },
                "y": {
                    "mean": y_mean,
                    "median": y_median,
                    "sd": y_sd,
                    "cv": y_cv,
                    "cagr": y_cagr
                }
            }
        }
        self.send_json(response_data)

    def handle_simulate_api(self, query):
        try:
            gdp_slider = float(query.get('gdpElasticity', [1.20])[0])
            vb_slider = int(query.get('vandeBharatCount', [30])[0])
            safety_slider = float(query.get('safetyMultiplier', [1.00])[0])
            freight_rate = float(query.get('freightRate', [4.0])[0]) / 100.0
        except ValueError:
            self.send_json({"error": "Invalid numeric parameter formats"}, 400)
            return

        pass_growth_rate = 0.065 * gdp_slider

        # 1. Simulate passengers
        sim_passengers = []
        last_pass = HISTORICAL_DATA["passengers"]["total"][-1] # FY24 passengers = 7500
        for i in range(5):
            last_pass = round(last_pass * (1.0 + pass_growth_rate))
            sim_passengers.append(last_pass)

        # 2. Simulate revenues
        last_pass_rev = HISTORICAL_DATA["revenue"]["passenger"][-1]
        last_freight_rev = HISTORICAL_DATA["revenue"]["freight"][-1]
        last_other_rev = HISTORICAL_DATA["revenue"]["other"][-1]
        sim_revenue = []
        
        for i in range(5):
            prev_pass = HISTORICAL_DATA["passengers"]["total"][-1] if i == 0 else sim_passengers[i-1]
            pass_ratio = sim_passengers[i] / prev_pass
            last_pass_rev = last_pass_rev * pass_ratio * (1.0 + 0.0002 * vb_slider) * 1.04
            last_freight_rev = last_freight_rev * (1.0 + freight_rate) * 1.05
            last_other_rev = last_other_rev * 1.05
            sim_revenue.append(round(last_pass_rev + last_freight_rev + last_other_rev))

        # 3. Simulate accidents
        sim_accidents = []
        last_acc = HISTORICAL_DATA["accidents"]["total"][-1] # FY24 accidents = 33
        for i in range(5):
            decay = 1.0 - 0.18 * safety_slider + 0.0013 * vb_slider
            last_acc = max(2, round(last_acc * decay))
            sim_accidents.append(last_acc)

        response_data = {
            "passengers": sim_passengers,
            "revenue": sim_revenue,
            "accidents": sim_accidents
        }
        self.send_json(response_data)

if __name__ == '__main__':
    # Ensure serving from the dashboard directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Simple workaround for Windows socket reuse issues
    socketserver.TCPServer.allow_reuse_address = True
    
    # Try port 80 first (for professional url with no port), fall back to 8000
    ports_to_try = [80, 8000]
    httpd = None
    active_port = None
    
    for port in ports_to_try:
        try:
            httpd = socketserver.TCPServer(("", port), CustomAPIRequestHandler)
            active_port = port
            break
        except Exception as e:
            print(f"[-] Port {port} unavailable: {e}")
            
    if httpd is None:
        print("[-] Critical Error: Could not bind to ports 80 or 8000.")
        sys.exit(1)
        
    host_str = "railhistory" if active_port == 80 else f"railhistory:{active_port}"
    print(f"[*] Indian Railways Custom Python API Server running at http://{host_str}/")
    print(f"serving static assets & statistics calculations endpoints dynamically...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)
