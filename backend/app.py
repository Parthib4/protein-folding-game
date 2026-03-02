from flask import Flask, request, jsonify
import subprocess
import os

app = Flask(__name__)

# Endpoint to process PyMOL scripts
@app.route('/process_pymol', methods=['POST'])
def process_pymol():
    try:
        # Get the PyMOL script from the request
        data = request.json
        script_content = data.get('script')

        # Save the script to a temporary file
        script_path = 'temp_script.pml'
        with open(script_path, 'w') as script_file:
            script_file.write(script_content)

        # Run the PyMOL script using subprocess
        result = subprocess.run(['pymol', '-cq', script_path], capture_output=True, text=True)

        # Remove the temporary script file
        os.remove(script_path)

        # Return the output of the PyMOL script
        if result.returncode == 0:
            return jsonify({"success": True, "output": result.stdout})
        else:
            return jsonify({"success": False, "error": result.stderr}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)