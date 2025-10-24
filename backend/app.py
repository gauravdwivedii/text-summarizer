from flask import Flask, render_template, request, jsonify, send_file
from summarizer import summarize_text
import os
import tempfile

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), '../frontend/templates'),
    static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static')
)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'})
        if file and file.filename.endswith('.txt'):
            text = file.read().decode('utf-8')
        else:
            return jsonify({'error': 'Only .txt files are allowed'})
    else:
        data = request.get_json()
        text = data.get('text', '')

    summary = summarize_text(text)
    return jsonify({'summary': summary})

@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    summary = data.get('summary', '')

    with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as temp_file:
        temp_file.write(summary)
        temp_path = temp_file.name

    return send_file(temp_path, as_attachment=True, download_name='summary.txt')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
