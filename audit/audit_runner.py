#!/usr/bin/env python3
"""
Comprehensive Security Audit Runner
Orchestrates the complete security audit process.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from security_auditor import SecurityAuditor
from risk_calculator import BusinessRiskCalculator

def run_comprehensive_audit(target_path: str, output_dir: str = ".", 
                          industry: str = "enterprise") -> dict:
    """Run a complete security audit with risk assessment."""
    
    print(f"Starting comprehensive security audit...")
    print(f"Target: {target_path}")
    print(f"Industry: {industry}")
    print("-" * 50)
    
    # Initialize auditor and run scan
    auditor = SecurityAuditor(target_path)
    audit_result = auditor.scan_directory()
    
    # Convert to dict for risk calculation
    audit_data = {
        'vulnerabilities': [
            {
                'severity': v.severity,
                'category': v.category,
                'description': v.description,
                'file_path': v.file_path,
                'line_number': v.line_number,
                'code_snippet': v.code_snippet,
                'remediation': v.remediation,
                'cwe_id': v.cwe_id,
                'cvss_score': v.cvss_score
            } for v in audit_result.vulnerabilities
        ],
        'risk_score': audit_result.risk_score,
        'total_files_scanned': audit_result.total_files_scanned,
        'timestamp': audit_result.timestamp,
        'scan_duration': audit_result.scan_duration
    }
    
    # Calculate business risk
    risk_calculator = BusinessRiskCalculator()
    risk_metrics = risk_calculator.generate_risk_assessment(audit_data, industry)
    executive_summary = risk_calculator.generate_executive_summary(risk_metrics)
    
    # Prepare comprehensive results
    comprehensive_results = {
        'audit_metadata': {
            'target_path': target_path,
            'scan_timestamp': audit_result.timestamp,
            'scan_duration_seconds': audit_result.scan_duration,
            'files_scanned': audit_result.total_files_scanned,
            'industry_context': industry
        },
        'vulnerability_summary': {
            'total_vulnerabilities': len(audit_result.vulnerabilities),
            'severity_breakdown': risk_metrics.severity_distribution,
            'risk_score': audit_result.risk_score,
            'business_impact_score': risk_metrics.business_impact_score
        },
        'executive_summary': executive_summary,
        'detailed_vulnerabilities': audit_data['vulnerabilities'],
        'remediation_roadmap': {
            'estimated_cost': risk_metrics.remediation_cost,
            'estimated_timeline_months': risk_metrics.timeline_months,
            'priority_actions': _generate_priority_actions(audit_result.vulnerabilities)
        }
    }
    
    # Save results
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save JSON results
    json_file = output_path / f"security_audit_{timestamp}.json"
    with open(json_file, 'w') as f:
        json.dump(comprehensive_results, f, indent=2, default=str)
    
    # Save human-readable report
    report_file = output_path / f"security_report_{timestamp}.txt"
    _generate_text_report(comprehensive_results, report_file)
    
    print(f"\nAudit completed successfully!")
    print(f"Results saved to: {json_file}")
    print(f"Report saved to: {report_file}")
    
    return comprehensive_results

def _generate_priority_actions(vulnerabilities) -> list:
    """Generate prioritized list of actions based on vulnerabilities."""
    actions = []
    
    # Group by severity and category
    critical_vulns = [v for v in vulnerabilities if v.severity == 'critical']
    high_vulns = [v for v in vulnerabilities if v.severity == 'high']
    
    if critical_vulns:
        actions.append({
            'priority': 1,
            'action': f"Address {len(critical_vulns)} critical vulnerabilities immediately",
            'categories': list(set(v.category for v in critical_vulns)),
            'timeline': '1-2 weeks'
        })
    
    if high_vulns:
        actions.append({
            'priority': 2,
            'action': f"Remediate {len(high_vulns)} high-severity vulnerabilities",
            'categories': list(set(v.category for v in high_vulns)),
            'timeline': '2-4 weeks'
        })
    
    # Add general security improvements
    actions.extend([
        {
            'priority': 3,
            'action': "Implement comprehensive input validation framework",
            'timeline': '4-6 weeks'
        },
        {
            'priority': 4,
            'action': "Establish security code review process",
            'timeline': '2-3 weeks'
        },
        {
            'priority': 5,
            'action': "Deploy automated security scanning in CI/CD pipeline",
            'timeline': '1-2 weeks'
        }
    ])
    
    return actions

def _generate_text_report(results: dict, output_file: Path):
    """Generate human-readable security report."""
    with open(output_file, 'w') as f:
        f.write("SECURITY AUDIT REPORT\n")
        f.write("=" * 50 + "\n\n")
        
        # Executive Summary
        f.write("EXECUTIVE SUMMARY\n")
        f.write("-" * 20 + "\n")
        exec_sum = results['executive_summary']
        f.write(f"Risk Level: {exec_sum['risk_level']}\n")
        f.write(f"Risk Score: {exec_sum['risk_score']}\n")
        f.write(f"Recommendation: {exec_sum['recommendation']}\n\n")
        
        f.write(f"Critical Vulnerabilities: {exec_sum['critical_vulnerabilities']}\n")
        f.write(f"High Vulnerabilities: {exec_sum['high_vulnerabilities']}\n")
        f.write(f"Total Vulnerabilities: {exec_sum['total_vulnerabilities']}\n\n")
        
        f.write(f"Estimated Remediation Cost: {exec_sum['estimated_remediation_cost']}\n")
        f.write(f"Estimated Timeline: {exec_sum['estimated_timeline']}\n")
        f.write(f"Business Impact Score: {exec_sum['business_impact_score']}\n\n")
        
        # Financial Exposure
        f.write("POTENTIAL FINANCIAL EXPOSURE\n")
        f.write("-" * 30 + "\n")
        exposure = exec_sum['potential_financial_exposure']
        f.write(f"Minimum: {exposure['minimum']}\n")
        f.write(f"Expected: {exposure['expected']}\n") 
        f.write(f"Maximum: {exposure['maximum']}\n\n")
        
        # Priority Actions
        f.write("REMEDIATION ROADMAP\n")
        f.write("-" * 20 + "\n")
        for action in results['remediation_roadmap']['priority_actions']:
            f.write(f"{action['priority']}. {action['action']}\n")
            if 'timeline' in action:
                f.write(f"   Timeline: {action['timeline']}\n")
            if 'categories' in action:
                f.write(f"   Categories: {', '.join(action['categories'])}\n")
            f.write("\n")
        
        # Detailed Vulnerabilities
        f.write("DETAILED VULNERABILITIES\n")
        f.write("-" * 25 + "\n")
        for vuln in results['detailed_vulnerabilities']:
            f.write(f"[{vuln['severity'].upper()}] {vuln['category'].replace('_', ' ').title()}\n")
            f.write(f"File: {vuln['file_path']}:{vuln['line_number']}\n")
            f.write(f"Description: {vuln['description']}\n")
            f.write(f"Code: {vuln['code_snippet']}\n")
            f.write(f"Remediation: {vuln['remediation']}\n")
            f.write(f"CWE: {vuln['cwe_id']}\n")
            f.write("-" * 40 + "\n")

def main():
    parser = argparse.ArgumentParser(description='Comprehensive Security Audit Runner')
    parser.add_argument('target', help='Target directory or repository to audit')
    parser.add_argument('-o', '--output', default='.', 
                       help='Output directory for results (default: current directory)')
    parser.add_argument('--industry', default='enterprise',
                       choices=['fintech', 'healthcare', 'ecommerce', 'enterprise', 'consumer'],
                       help='Industry context for risk calculation (default: enterprise)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.target):
        print(f"Error: Target path '{args.target}' does not exist")
        sys.exit(1)
    
    try:
        results = run_comprehensive_audit(args.target, args.output, args.industry)
        
        # Print key results
        print(f"\n{'='*50}")
        print("AUDIT SUMMARY")
        print(f"{'='*50}")
        exec_sum = results['executive_summary']
        print(f"Risk Level: {exec_sum['risk_level']}")
        print(f"Risk Score: {exec_sum['risk_score']}")
        print(f"Total Vulnerabilities: {exec_sum['total_vulnerabilities']}")
        print(f"Critical: {exec_sum['critical_vulnerabilities']}, High: {exec_sum['high_vulnerabilities']}")
        print(f"Estimated Cost: {exec_sum['estimated_remediation_cost']}")
        print(f"Timeline: {exec_sum['estimated_timeline']}")
        
    except Exception as e:
        print(f"Error during audit: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()