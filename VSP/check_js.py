import sys
import esprima

try:
    with open('public/js/requests.js', 'r', encoding='utf-8') as f:
        code = f.read()
    esprima.parseScript(code)
    print("Syntax OK")
except Exception as e:
    print("Syntax Error:", e)
