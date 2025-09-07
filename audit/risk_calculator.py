#!/usr/bin/env python3
"""
Risk Calculator for Security Audits
Calculates business risk and financial impact from security vulnerabilities.
"""

from typing import Dict, List, Any
from dataclasses import dataclass
import json

@dataclass
class RiskMetrics:
    vulnerability_count: int
    severity_distribution: Dict[str, int]
    risk_score: float
    business_impact_score: float
    remediation_cost: Dict[str, float]
    timeline_months: float
    
class BusinessRiskCalculator:
    def __init__(self):
        # Base costs for remediation by severity (in USD)
        self.remediation_costs = {
            'critical': 15000,
            'high': 8000,
            'medium': 3000,
            'low': 1000
        }
        
        # Business impact multipliers
        self.impact_multipliers = {
            'data_breach': 2.5,
            'service_disruption': 1.8,
            'compliance_violation': 2.2,
            'reputation_damage': 1.5
        }
        
        # Industry risk factors
        self.industry_factors = {
            'fintech': 1.8,
            'healthcare': 1.7,
            'ecommerce': 1.4,
            'enterprise': 1.2,
            'consumer': 1.0
        }

    def calculate_remediation_cost(self, severity_distribution: Dict[str, int]) -> Dict[str, float]:
        """Calculate estimated remediation costs by severity."""
        costs = {}
        total_cost = 0
        
        for severity, count in severity_distribution.items():
            base_cost = self.remediation_costs.get(severity, 1000)
            severity_cost = base_cost * count
            costs[severity] = severity_cost
            total_cost += severity_cost
            
        costs['total'] = total_cost
        return costs

    def calculate_business_impact_score(self, vulnerability_data: List[Dict[str, Any]]) -> float:
        """Calculate potential business impact score (1-10 scale)."""
        if not vulnerability_data:
            return 0.0
            
        # Count high-impact vulnerability categories
        high_impact_categories = {
            'sql_injection': 9.0,
            'command_injection': 9.0,
            'xss': 7.0,
            'ssrf': 6.0,
            'hardcoded_secrets': 8.0,
            'insecure_deserialization': 7.5,
            'path_traversal': 6.5
        }
        
        impact_scores = []
        for vuln in vulnerability_data:
            category = vuln.get('category', '')
            severity = vuln.get('severity', 'low')
            
            base_impact = high_impact_categories.get(category, 3.0)
            
            # Adjust by severity
            severity_multiplier = {
                'critical': 1.0,
                'high': 0.8,
                'medium': 0.6,
                'low': 0.3
            }.get(severity, 0.3)
            
            impact_scores.append(base_impact * severity_multiplier)
        
        if not impact_scores:
            return 0.0
            
        # Use weighted average with emphasis on highest impacts
        impact_scores.sort(reverse=True)
        top_impacts = impact_scores[:5]  # Consider top 5 most severe
        
        return round(sum(top_impacts) / len(top_impacts), 1)

    def estimate_timeline(self, severity_distribution: Dict[str, int]) -> float:
        """Estimate remediation timeline in months."""
        timeline_days = {
            'critical': 30,  # 1 month per critical
            'high': 14,      # 2 weeks per high
            'medium': 7,     # 1 week per medium
            'low': 2         # 2 days per low
        }
        
        total_days = 0
        for severity, count in severity_distribution.items():
            days_per_vuln = timeline_days.get(severity, 7)
            total_days += days_per_vuln * count
        
        # Account for parallelization (assume 2 developers working)
        parallelized_days = total_days / 2
        
        # Add 20% buffer for testing and review
        buffered_days = parallelized_days * 1.2
        
        return round(buffered_days / 30, 1)  # Convert to months

    def calculate_financial_exposure(self, risk_score: float, business_impact: float) -> Dict[str, float]:
        """Calculate potential financial exposure ranges."""
        
        # Base exposure calculation
        base_exposure = (risk_score * business_impact * 10000)  # Base $10k per risk point
        
        # Potential ranges
        minimum_exposure = base_exposure * 0.5
        maximum_exposure = base_exposure * 3.5
        expected_exposure = base_exposure * 1.2
        
        return {
            'minimum': round(minimum_exposure),
            'expected': round(expected_exposure),
            'maximum': round(maximum_exposure)
        }

    def generate_risk_assessment(self, audit_data: Dict[str, Any], 
                               industry: str = 'enterprise') -> RiskMetrics:
        """Generate comprehensive risk assessment."""
        
        vulnerabilities = audit_data.get('vulnerabilities', [])
        
        # Calculate severity distribution
        severity_distribution = {}
        for vuln in vulnerabilities:
            severity = vuln.get('severity', 'low')
            severity_distribution[severity] = severity_distribution.get(severity, 0) + 1
        
        # Calculate metrics
        risk_score = audit_data.get('risk_score', 0.0)
        business_impact = self.calculate_business_impact_score(vulnerabilities)
        remediation_costs = self.calculate_remediation_cost(severity_distribution)
        timeline = self.estimate_timeline(severity_distribution)
        
        # Apply industry factor
        industry_factor = self.industry_factors.get(industry.lower(), 1.0)
        adjusted_risk_score = min(10.0, risk_score * industry_factor)
        
        return RiskMetrics(
            vulnerability_count=len(vulnerabilities),
            severity_distribution=severity_distribution,
            risk_score=adjusted_risk_score,
            business_impact_score=business_impact,
            remediation_cost=remediation_costs,
            timeline_months=timeline
        )

    def generate_executive_summary(self, risk_metrics: RiskMetrics) -> Dict[str, Any]:
        """Generate executive summary for acquisition decisions."""
        
        # Risk level determination
        if risk_metrics.risk_score >= 8.0:
            risk_level = "CRITICAL"
            recommendation = "HIGH RISK - Recommend against acquisition without major security remediation commitment"
        elif risk_metrics.risk_score >= 6.0:
            risk_level = "HIGH"  
            recommendation = "PROCEED WITH CAUTION - Significant security investment required"
        elif risk_metrics.risk_score >= 4.0:
            risk_level = "MEDIUM"
            recommendation = "ACCEPTABLE WITH CONDITIONS - Security improvements needed"
        else:
            risk_level = "LOW"
            recommendation = "LOW RISK - Minor security enhancements recommended"
        
        # Financial exposure
        financial_exposure = self.calculate_financial_exposure(
            risk_metrics.risk_score, 
            risk_metrics.business_impact_score
        )
        
        return {
            'risk_level': risk_level,
            'risk_score': f"{risk_metrics.risk_score}/10",
            'recommendation': recommendation,
            'critical_vulnerabilities': risk_metrics.severity_distribution.get('critical', 0),
            'high_vulnerabilities': risk_metrics.severity_distribution.get('high', 0),
            'total_vulnerabilities': risk_metrics.vulnerability_count,
            'estimated_remediation_cost': f"${risk_metrics.remediation_cost['total']:,}",
            'estimated_timeline': f"{risk_metrics.timeline_months} months",
            'potential_financial_exposure': {
                'minimum': f"${financial_exposure['minimum']:,}",
                'expected': f"${financial_exposure['expected']:,}",
                'maximum': f"${financial_exposure['maximum']:,}"
            },
            'business_impact_score': f"{risk_metrics.business_impact_score}/10"
        }

def main():
    """Example usage of the risk calculator."""
    # This would typically receive audit results from security_auditor.py
    sample_audit_data = {
        'vulnerabilities': [
            {'severity': 'critical', 'category': 'sql_injection'},
            {'severity': 'high', 'category': 'xss'},
            {'severity': 'high', 'category': 'ssrf'},
            {'severity': 'medium', 'category': 'weak_crypto'}
        ],
        'risk_score': 7.2
    }
    
    calculator = BusinessRiskCalculator()
    risk_metrics = calculator.generate_risk_assessment(sample_audit_data)
    executive_summary = calculator.generate_executive_summary(risk_metrics)
    
    print("Risk Assessment Results:")
    print(json.dumps(executive_summary, indent=2))

if __name__ == '__main__':
    main()