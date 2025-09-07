#!/usr/bin/env python3
"""
Security Acquisition Auditor
A comprehensive security vulnerability scanner for codebase due diligence.
"""

import os
import re
import json
import hashlib
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class Vulnerability:
    severity: str  # critical, high, medium, low
    category: str
    description: str
    file_path: str
    line_number: int
    code_snippet: str
    remediation: str
    cwe_id: str = ""
    cvss_score: float = 0.0

@dataclass
class AuditResult:
    total_files_scanned: int
    vulnerabilities: List[Vulnerability]
    risk_score: float
    timestamp: str
    scan_duration: float

class SecurityAuditor:
    def __init__(self, target_path: str):
        self.target_path = Path(target_path)
        self.vulnerabilities = []
        self.file_extensions = {
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', '.php', 
            '.rb', '.go', '.rs', '.cpp', '.c', '.h', '.sql', '.json', '.yaml', '.yml'
        }
        
        # Security patterns organized by vulnerability type
        self.patterns = {
            'xss': [
                (r'innerHTML\s*=\s*[^;]*\+', 'Potential XSS via innerHTML concatenation'),
                (r'document\.write\s*\([^)]*\+', 'Potential XSS via document.write concatenation'),
                (r'eval\s*\([^)]*\+', 'Potential XSS via eval with user input'),
                (r'dangerouslySetInnerHTML.*[^}]}\}', 'React dangerouslySetInnerHTML usage'),
                (r'v-html\s*=\s*["\'][^"\']*\+', 'Vue.js v-html with concatenation'),
            ],
            'sql_injection': [
                (r'SELECT.*\+.*FROM', 'SQL query with string concatenation'),
                (r'INSERT.*\+.*VALUES', 'SQL INSERT with string concatenation'),
                (r'UPDATE.*SET.*\+', 'SQL UPDATE with string concatenation'),
                (r'DELETE.*WHERE.*\+', 'SQL DELETE with string concatenation'),
                (r'query\s*\(\s*["\'][^"\']*\+', 'Database query with concatenation'),
                (r'execute\s*\(\s*["\'][^"\']*\+', 'SQL execute with concatenation'),
            ],
            'command_injection': [
                (r'exec\s*\([^)]*\+', 'Command execution with concatenation'),
                (r'system\s*\([^)]*\+', 'System command with concatenation'),
                (r'shell_exec\s*\([^)]*\+', 'Shell execution with concatenation'),
                (r'subprocess\.call\s*\([^)]*\+', 'Subprocess call with concatenation'),
                (r'os\.system\s*\([^)]*\+', 'OS system call with concatenation'),
            ],
            'path_traversal': [
                (r'\.\./', 'Potential path traversal sequence'),
                (r'\.\.\\\\', 'Potential Windows path traversal'),
                (r'file_get_contents\s*\([^)]*\$', 'File access with variable path'),
                (r'readFile\s*\([^)]*\+', 'File read with concatenated path'),
                (r'open\s*\([^)]*\+.*["\']r', 'File open with concatenated path'),
            ],
            'ssrf': [
                (r'fetch\s*\(\s*[^)]*\$', 'HTTP request with variable URL'),
                (r'axios\.[a-z]+\s*\([^)]*\$', 'Axios request with variable URL'),
                (r'http\.get\s*\([^)]*\$', 'HTTP GET with variable URL'),
                (r'requests\.[a-z]+\s*\([^)]*\+', 'Python requests with concatenated URL'),
                (r'curl\s+[^;]*\$', 'cURL with variable URL'),
            ],
            'hardcoded_secrets': [
                (r'password\s*=\s*["\'][^"\']{8,}["\']', 'Hardcoded password'),
                (r'api[_-]?key\s*=\s*["\'][^"\']{16,}["\']', 'Hardcoded API key'),
                (r'secret\s*=\s*["\'][^"\']{16,}["\']', 'Hardcoded secret'),
                (r'token\s*=\s*["\'][^"\']{20,}["\']', 'Hardcoded token'),
                (r'[A-Z0-9]{32,}', 'Potential hardcoded hash/key'),
            ],
            'weak_crypto': [
                (r'md5\s*\(', 'Weak MD5 hashing'),
                (r'sha1\s*\(', 'Weak SHA1 hashing'),
                (r'DES|RC4', 'Weak encryption algorithm'),
                (r'Math\.random\s*\(', 'Weak random number generation'),
                (r'random\s*\(\s*\)', 'Weak random function usage'),
            ],
            'insecure_deserialization': [
                (r'pickle\.loads\s*\(', 'Unsafe pickle deserialization'),
                (r'JSON\.parse\s*\([^)]*req\.body', 'JSON parsing user input'),
                (r'unserialize\s*\(\s*\$_', 'PHP unserialize user input'),
                (r'yaml\.load\s*\([^)]*\)', 'YAML load without safe loader'),
            ],
            'information_disclosure': [
                (r'console\.log\s*\([^)]*password', 'Password logged to console'),
                (r'print\s*\([^)]*password', 'Password in print statement'),
                (r'printStackTrace\s*\(\s*\)', 'Stack trace exposure'),
                (r'error_reporting\s*\(\s*E_ALL', 'Full error reporting enabled'),
            ]
        }

    def scan_file(self, file_path: Path) -> List[Vulnerability]:
        vulnerabilities = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
                
            for category, patterns in self.patterns.items():
                for pattern, description in patterns:
                    for line_num, line in enumerate(lines, 1):
                        if re.search(pattern, line, re.IGNORECASE):
                            severity = self._get_severity(category)
                            vuln = Vulnerability(
                                severity=severity,
                                category=category,
                                description=description,
                                file_path=str(file_path.relative_to(self.target_path)),
                                line_number=line_num,
                                code_snippet=line.strip(),
                                remediation=self._get_remediation(category),
                                cwe_id=self._get_cwe_id(category),
                                cvss_score=self._get_cvss_score(severity)
                            )
                            vulnerabilities.append(vuln)
                            
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
            
        return vulnerabilities

    def _get_severity(self, category: str) -> str:
        severity_map = {
            'sql_injection': 'critical',
            'command_injection': 'critical',
            'xss': 'critical',
            'ssrf': 'high',
            'path_traversal': 'high',
            'hardcoded_secrets': 'high',
            'insecure_deserialization': 'high',
            'weak_crypto': 'medium',
            'information_disclosure': 'medium'
        }
        return severity_map.get(category, 'low')

    def _get_remediation(self, category: str) -> str:
        remediation_map = {
            'xss': 'Use proper input validation and output encoding. Implement CSP headers.',
            'sql_injection': 'Use parameterized queries or prepared statements.',
            'command_injection': 'Validate and sanitize all user inputs. Use safe APIs.',
            'path_traversal': 'Validate file paths and use allowlists for permitted directories.',
            'ssrf': 'Validate and restrict URLs. Use allowlists for permitted domains.',
            'hardcoded_secrets': 'Use environment variables or secure key management systems.',
            'weak_crypto': 'Use strong cryptographic algorithms (AES-256, SHA-256+).',
            'insecure_deserialization': 'Validate data before deserialization or use safe formats.',
            'information_disclosure': 'Remove sensitive information from logs and error messages.'
        }
        return remediation_map.get(category, 'Review and secure the identified code.')

    def _get_cwe_id(self, category: str) -> str:
        cwe_map = {
            'xss': 'CWE-79',
            'sql_injection': 'CWE-89',
            'command_injection': 'CWE-78',
            'path_traversal': 'CWE-22',
            'ssrf': 'CWE-918',
            'hardcoded_secrets': 'CWE-798',
            'weak_crypto': 'CWE-327',
            'insecure_deserialization': 'CWE-502',
            'information_disclosure': 'CWE-200'
        }
        return cwe_map.get(category, 'CWE-Unknown')

    def _get_cvss_score(self, severity: str) -> float:
        score_map = {
            'critical': 9.0,
            'high': 7.5,
            'medium': 5.0,
            'low': 2.5
        }
        return score_map.get(severity, 0.0)

    def calculate_risk_score(self, vulnerabilities: List[Vulnerability]) -> float:
        if not vulnerabilities:
            return 0.0
            
        severity_weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        total_score = sum(severity_weights.get(v.severity, 0) for v in vulnerabilities)
        max_possible = len(vulnerabilities) * 10
        
        return round((total_score / max_possible) * 10, 1) if max_possible > 0 else 0.0

    def scan_directory(self) -> AuditResult:
        start_time = datetime.now()
        files_scanned = 0
        
        print(f"Starting security audit of: {self.target_path}")
        
        for file_path in self.target_path.rglob('*'):
            if (file_path.is_file() and 
                file_path.suffix.lower() in self.file_extensions and
                not self._should_skip_file(file_path)):
                
                print(f"Scanning: {file_path.relative_to(self.target_path)}")
                vulnerabilities = self.scan_file(file_path)
                self.vulnerabilities.extend(vulnerabilities)
                files_scanned += 1

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        risk_score = self.calculate_risk_score(self.vulnerabilities)
        
        return AuditResult(
            total_files_scanned=files_scanned,
            vulnerabilities=self.vulnerabilities,
            risk_score=risk_score,
            timestamp=start_time.isoformat(),
            scan_duration=duration
        )

    def _should_skip_file(self, file_path: Path) -> bool:
        skip_patterns = [
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'build', 'dist', '.next', 'target', 'bin', 'obj'
        ]
        return any(pattern in str(file_path) for pattern in skip_patterns)

    def export_results(self, result: AuditResult, output_file: str):
        output_path = Path(output_file)
        
        if output_path.suffix.lower() == '.json':
            with open(output_path, 'w') as f:
                json.dump(asdict(result), f, indent=2, default=str)
        else:
            # Default to human-readable format
            with open(output_path, 'w') as f:
                f.write(f"Security Audit Report\n")
                f.write(f"====================\n\n")
                f.write(f"Scan Date: {result.timestamp}\n")
                f.write(f"Files Scanned: {result.total_files_scanned}\n")
                f.write(f"Vulnerabilities Found: {len(result.vulnerabilities)}\n")
                f.write(f"Risk Score: {result.risk_score}/10\n")
                f.write(f"Scan Duration: {result.scan_duration:.2f} seconds\n\n")
                
                severity_counts = {}
                for vuln in result.vulnerabilities:
                    severity_counts[vuln.severity] = severity_counts.get(vuln.severity, 0) + 1
                
                f.write("Vulnerability Summary:\n")
                for severity in ['critical', 'high', 'medium', 'low']:
                    count = severity_counts.get(severity, 0)
                    f.write(f"  {severity.title()}: {count}\n")
                f.write("\n")
                
                for vuln in result.vulnerabilities:
                    f.write(f"[{vuln.severity.upper()}] {vuln.category.replace('_', ' ').title()}\n")
                    f.write(f"  File: {vuln.file_path}:{vuln.line_number}\n")
                    f.write(f"  Description: {vuln.description}\n")
                    f.write(f"  Code: {vuln.code_snippet}\n")
                    f.write(f"  Remediation: {vuln.remediation}\n")
                    f.write(f"  CWE: {vuln.cwe_id}\n\n")

def main():
    parser = argparse.ArgumentParser(description='Security Acquisition Auditor')
    parser.add_argument('target', help='Target directory or repository to scan')
    parser.add_argument('-o', '--output', default='audit_report.txt', 
                       help='Output file for results (default: audit_report.txt)')
    parser.add_argument('--json', action='store_true',
                       help='Output results in JSON format')
    
    args = parser.parse_args()
    
    if args.json and not args.output.endswith('.json'):
        args.output = args.output.rsplit('.', 1)[0] + '.json'
    
    auditor = SecurityAuditor(args.target)
    result = auditor.scan_directory()
    auditor.export_results(result, args.output)
    
    print(f"\nScan completed!")
    print(f"Files scanned: {result.total_files_scanned}")
    print(f"Vulnerabilities found: {len(result.vulnerabilities)}")
    print(f"Risk score: {result.risk_score}/10")
    print(f"Results saved to: {args.output}")

if __name__ == '__main__':
    main()