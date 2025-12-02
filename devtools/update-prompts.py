#!/usr/bin/env python3
"""
update-prompts.py - Updates DEFAULT_PROMPTS in api.js from prompts/*.md files

This script reads prompt files from the prompts/ directory, extracts the body
content (after YAML frontmatter), and updates the static DEFAULT_PROMPTS object
in js/api.js.

Usage:
    python update-prompts.py

The script expects:
    - prompts/*.md files with YAML frontmatter (name, description) and body content
    - js/api.js with a static DEFAULT_PROMPTS = { ... } block to replace
"""

import re
import sys
from pathlib import Path


# Prompt files to process (name -> filename)
PROMPT_FILES = {
    'optimize': 'optimize.md',
    'chat': 'chat.md',
    'chat_fallback': 'chat_fallback.md',
    'refine': 'refine.md',
    'refine_no_chat': 'refine_no_chat.md',
}


def parse_yaml_frontmatter(content: str) -> tuple[dict, str]:
    """
    Parse YAML frontmatter from markdown content.
    Returns (metadata_dict, body_content)
    """
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if match:
        yaml_text = match.group(1)
        body = match.group(2).strip()
        
        # Simple YAML parsing for name/description
        metadata = {}
        for line in yaml_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip()
        
        return metadata, body
    
    # No frontmatter found, return content as-is
    return {}, content.strip()


def escape_js_string(s: str) -> str:
    """
    Escape a string for use in a JavaScript template literal (backtick string).
    """
    # Escape backticks and ${} template expressions
    s = s.replace('\\', '\\\\')  # Escape backslashes first
    s = s.replace('`', '\\`')     # Escape backticks
    s = s.replace('${', '\\${')   # Escape template expressions
    return s


def load_prompts(prompts_dir: Path) -> dict[str, str]:
    """
    Load all prompt files and return a dict of {name: body_content}
    """
    prompts = {}
    
    for name, filename in PROMPT_FILES.items():
        filepath = prompts_dir / filename
        
        if not filepath.exists():
            print(f"Warning: {filepath} not found, skipping")
            continue
        
        content = filepath.read_text(encoding='utf-8')
        metadata, body = parse_yaml_frontmatter(content)
        
        prompts[name] = body
        print(f"Loaded: {filename} ({len(body)} chars)")
    
    return prompts


def generate_default_prompts_js(prompts: dict[str, str]) -> str:
    """
    Generate the JavaScript code for the static DEFAULT_PROMPTS object.
    """
    lines = ["    static DEFAULT_PROMPTS = {"]
    
    prompt_entries = []
    for name, body in prompts.items():
        escaped_body = escape_js_string(body)
        # Use backtick strings for multiline content
        if '\n' in body or name == 'chat_fallback':
            if name == 'chat_fallback':
                # Short single-line prompt uses regular quotes
                prompt_entries.append(f'        {name}: "{escaped_body.replace(chr(10), "")}"')
            else:
                prompt_entries.append(f'        {name}: `{escaped_body}`')
        else:
            prompt_entries.append(f'        {name}: "{escaped_body}"')
    
    lines.append(',\n'.join(prompt_entries))
    lines.append("\n    };")
    
    return '\n'.join(lines)


def update_api_js(api_js_path: Path, new_prompts_js: str) -> bool:
    """
    Update the DEFAULT_PROMPTS block in api.js with new content.
    Returns True if successful.
    """
    content = api_js_path.read_text(encoding='utf-8')
    
    # Pattern to match the entire static DEFAULT_PROMPTS = { ... }; block
    # This handles multiline content with nested braces
    pattern = r'(    static DEFAULT_PROMPTS = \{)[\s\S]*?(    \};)'
    
    # Check if pattern exists
    if not re.search(pattern, content):
        print("Error: Could not find DEFAULT_PROMPTS block in api.js")
        return False
    
    # Replace the block
    new_content = re.sub(pattern, new_prompts_js, content)
    
    # Write back
    api_js_path.write_text(new_content, encoding='utf-8')
    return True


def main():
    # Determine paths relative to script location
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent
    prompts_dir = project_root / 'docs' / 'prompts'
    api_js_path = project_root / 'js' / 'api.js'
    
    # Validate paths
    if not prompts_dir.exists():
        print(f"Error: Prompts directory not found: {prompts_dir}")
        sys.exit(1)
    
    if not api_js_path.exists():
        print(f"Error: api.js not found: {api_js_path}")
        sys.exit(1)
    
    print(f"Loading prompts from: {prompts_dir}")
    print(f"Updating: {api_js_path}")
    print()
    
    # Load prompts
    prompts = load_prompts(prompts_dir)
    
    if not prompts:
        print("Error: No prompts loaded")
        sys.exit(1)
    
    # Generate new JS code
    new_prompts_js = generate_default_prompts_js(prompts)
    
    # Update api.js
    print()
    if update_api_js(api_js_path, new_prompts_js):
        print("Successfully updated DEFAULT_PROMPTS in api.js")
        print(f"Updated {len(prompts)} prompts: {', '.join(prompts.keys())}")
    else:
        print("Failed to update api.js")
        sys.exit(1)


if __name__ == '__main__':
    main()
