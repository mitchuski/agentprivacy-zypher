#!/usr/bin/env python3
"""
Hex Decoder for Zcash Inscriptions
Converts hex-encoded proverb text from inscriptions to readable text.
Supports multiple encoding formats and handles common edge cases.
"""

import sys
import binascii
import json
from typing import Optional, Dict, Any


def hex_to_text(hex_string: str, encoding: str = 'utf-8') -> str:
    """
    Convert hex string to text.
    
    Args:
        hex_string: Hex-encoded string (with or without '0x' prefix)
        encoding: Text encoding (default: 'utf-8')
    
    Returns:
        Decoded text string
    """
    try:
        # Remove '0x' prefix if present
        if hex_string.startswith('0x') or hex_string.startswith('0X'):
            hex_string = hex_string[2:]
        
        # Remove whitespace
        hex_string = hex_string.replace(' ', '').replace('\n', '').replace('\t', '')
        
        # Convert hex to bytes
        try:
            bytes_data = binascii.unhexlify(hex_string)
        except binascii.Error as e:
            raise ValueError(f"Invalid hex string: {e}")
        
        # Decode bytes to text
        try:
            text = bytes_data.decode(encoding)
        except UnicodeDecodeError:
            # Try to decode with error handling (replace invalid chars)
            text = bytes_data.decode(encoding, errors='replace')
        
        # Remove null bytes and trailing whitespace
        text = text.replace('\x00', '').strip()
        
        return text
    
    except Exception as e:
        raise ValueError(f"Failed to decode hex: {e}")


def decode_inscription_content(hex_content: str) -> Dict[str, Any]:
    """
    Decode inscription content that may contain hex-encoded proverb.
    
    Args:
        hex_content: Hex-encoded content from inscription
    
    Returns:
        Dictionary with decoded text and metadata
    """
    result = {
        'decoded': False,
        'text': '',
        'raw_hex': hex_content,
        'encoding': 'utf-8',
        'error': None
    }
    
    try:
        # Try to decode as hex
        decoded_text = hex_to_text(hex_content)
        result['decoded'] = True
        result['text'] = decoded_text
        
        # Check if it looks like STS format
        if decoded_text.startswith('STS|') or decoded_text.startswith('STM-'):
            result['format'] = 'sts'
        elif decoded_text.startswith('rpp-v1'):
            result['format'] = 'rpp-v1'
        else:
            result['format'] = 'plain'
        
    except Exception as e:
        result['error'] = str(e)
    
    return result


def decode_from_transaction(script_sig_hex: str) -> Optional[Dict[str, Any]]:
    """
    Extract and decode inscription from transaction scriptSig hex.
    
    This looks for Ordinals-style inscription envelope in the scriptSig.
    Format: <push "ord"> OP_1 <push content-type> OP_0 <push content>
    
    Args:
        script_sig_hex: Hex-encoded scriptSig from transaction input
    
    Returns:
        Dictionary with decoded inscription or None
    """
    try:
        script_sig = binascii.unhexlify(script_sig_hex.replace(' ', ''))
        
        # Look for "ord" marker
        ord_marker = b'ord'
        ord_offset = -1
        
        for i in range(len(script_sig) - len(ord_marker) - 1):
            if script_sig[i] == 0x03 and script_sig[i+1:i+4] == ord_marker:
                ord_offset = i
                break
        
        if ord_offset == -1:
            return None
        
        offset = ord_offset + 1 + len(ord_marker)
        
        # Check for OP_1 (0x51)
        if offset >= len(script_sig) or script_sig[offset] != 0x51:
            return None
        offset += 1
        
        # Read content-type
        content_type = ''
        if offset < len(script_sig):
            opcode = script_sig[offset]
            if 0x01 <= opcode <= 0x4b:  # Direct push
                length = opcode
                if offset + 1 + length <= len(script_sig):
                    content_type = script_sig[offset+1:offset+1+length].decode('utf-8', errors='replace')
                    offset += 1 + length
            elif opcode == 0x4c:  # OP_PUSHDATA1
                if offset + 1 < len(script_sig):
                    length = script_sig[offset + 1]
                    if offset + 2 + length <= len(script_sig):
                        content_type = script_sig[offset+2:offset+2+length].decode('utf-8', errors='replace')
                        offset += 2 + length
        
        # Check for OP_0 (0x00)
        if offset >= len(script_sig) or script_sig[offset] != 0x00:
            return None
        offset += 1
        
        # Read content
        content = ''
        if offset < len(script_sig):
            opcode = script_sig[offset]
            if 0x01 <= opcode <= 0x4b:  # Direct push
                length = opcode
                if offset + 1 + length <= len(script_sig):
                    content_bytes = script_sig[offset+1:offset+1+length]
                    content = content_bytes.decode('utf-8', errors='replace')
            elif opcode == 0x4c:  # OP_PUSHDATA1
                if offset + 1 < len(script_sig):
                    length = script_sig[offset + 1]
                    if offset + 2 + length <= len(script_sig):
                        content_bytes = script_sig[offset+2:offset+2+length]
                        content = content_bytes.decode('utf-8', errors='replace')
            elif opcode == 0x4d:  # OP_PUSHDATA2
                if offset + 3 <= len(script_sig):
                    length = int.from_bytes(script_sig[offset+1:offset+3], 'little')
                    if offset + 3 + length <= len(script_sig):
                        content_bytes = script_sig[offset+3:offset+3+length]
                        content = content_bytes.decode('utf-8', errors='replace')
        
        if not content:
            return None
        
        return {
            'content_type': content_type,
            'content': content,
            'decoded': decode_inscription_content(content) if content.startswith(('0x', '0X')) or all(c in '0123456789abcdefABCDEF' for c in content.replace(' ', '')) else {
                'decoded': True,
                'text': content,
                'format': 'sts' if content.startswith('STS|') else 'plain'
            }
        }
    
    except Exception as e:
        return {'error': str(e)}


def main():
    """CLI interface for hex decoder."""
    if len(sys.argv) < 2:
        print("Usage: python hex-decoder.py <hex_string> [encoding]")
        print("   or: python hex-decoder.py --tx <script_sig_hex>")
        sys.exit(1)
    
    if sys.argv[1] == '--tx':
        # Decode from transaction scriptSig
        if len(sys.argv) < 3:
            print("Error: ScriptSig hex required")
            sys.exit(1)
        
        result = decode_from_transaction(sys.argv[2])
        if result:
            print(json.dumps(result, indent=2))
        else:
            print("No inscription found in scriptSig")
            sys.exit(1)
    
    else:
        # Decode hex string directly
        hex_string = sys.argv[1]
        encoding = sys.argv[2] if len(sys.argv) > 2 else 'utf-8'
        
        try:
            decoded = hex_to_text(hex_string, encoding)
            result = {
                'hex': hex_string,
                'decoded': decoded,
                'encoding': encoding
            }
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == '__main__':
    main()

