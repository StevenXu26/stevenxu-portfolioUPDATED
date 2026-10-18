"""Local preview for the static portfolio; no packages required."""
import argparse
import functools
import re
import shutil
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class PreviewHandler(SimpleHTTPRequestHandler):
    # Let the browser stream and seek large local MP4/GLB files.
    def send_head(self):
        self.remaining = None
        path = Path(self.translate_path(self.path))
        requested = self.headers.get('Range')
        if requested and path.is_file():
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            if match:
                size = path.stat().st_size
                first, last = match.groups()
                start = int(first) if first else max(0, size-int(last or 0))
                end = min(int(last), size-1) if first and last else size-1
                if start > end or start >= size:
                    self.send_response(416)
                    self.send_header('Content-Range', f'bytes */{size}')
                    self.end_headers()
                    return None
                stream = path.open('rb')
                stream.seek(start)
                self.remaining = end-start+1
                self.send_response(206)
                self.send_header('Content-Type', self.guess_type(str(path)))
                self.send_header('Content-Length', str(self.remaining))
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()
                return stream
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def copyfile(self, source, output):
        if self.remaining is None:
            return shutil.copyfileobj(source, output)
        while self.remaining:
            chunk = source.read(min(65536, self.remaining))
            if not chunk: break
            output.write(chunk)
            self.remaining -= len(chunk)

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--no-browser', action='store_true')
    options = args.parse_args()
    handler = functools.partial(PreviewHandler, directory=str(Path(__file__).resolve().parent))
    try:
        server = ThreadingHTTPServer(('127.0.0.1',8000),handler)
    except OSError:
        print('A preview may already be running. Open http://127.0.0.1:8000/edit.html or close the other preview window first.')
        raise SystemExit(1)
    print('Portfolio: http://127.0.0.1:8000/')
    print('Media editor: http://127.0.0.1:8000/edit.html')
    print('Keep this window open while editing. Press Ctrl+C to stop.')
    if not options.no_browser: webbrowser.open('http://127.0.0.1:8000/edit.html')
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
