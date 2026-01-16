#!/usr/bin/env python3
"""
Impact Analysis Tool for SEO/LLM/Performance Improvements

This tool provides before/after comparison analysis and visualization
of website performance improvements across SEO, LLM, and Performance metrics.
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import seaborn as sns
from pathlib import Path

# ---------------------------------------------------------------------------
# Data-Driven Recommendation Mappings
# ---------------------------------------------------------------------------
# Maps (category, metric_keyword) -> recommendation text
# Used by _generate_recommendations to avoid nested if/elif chains

RECOMMENDATION_MAPPINGS: Dict[str, Dict[str, str]] = {
    'seo_metrics': {
        'structured_data': "Implement comprehensive Schema.org markup across all page types",
        'meta_completeness': "Optimize meta titles and descriptions for all pages",
        'header_hierarchy': "Restructure content with proper H1-H6 hierarchy",
    },
    'llm_metrics': {
        'readability': "Simplify content language and sentence structure",
        'semantic_html': "Replace generic divs with semantic HTML5 elements",
        'entity_recognition': "Add structured data for better entity identification",
    },
    'performance_metrics': {
        'page_load_time': "Implement image optimization and lazy loading",
        'lcp': "Optimize critical rendering path and largest content elements",
        'cls': "Reserve space for dynamic content to prevent layout shifts",
    },
}

DEFAULT_RECOMMENDATIONS: List[str] = [
    "Continue monitoring performance trends",
    "Implement A/B testing for further optimizations",
    "Set up automated performance alerts",
]


class ImpactAnalyzer:
    """
    Analyzes and visualizes the impact of website optimizations
    across SEO, LLM compatibility, and performance metrics.
    """
    
    def __init__(self, output_dir: str = "impact_analysis"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Set up plotting style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # Define metric categories and their ideal ranges
        self.metric_categories = {
            'seo_metrics': {
                'structured_data_coverage': {'min': 0.8, 'max': 1.0, 'unit': '%'},
                'meta_completeness': {'min': 0.9, 'max': 1.0, 'unit': '%'},
                'header_hierarchy_score': {'min': 0.8, 'max': 1.0, 'unit': '%'},
                'internal_link_density': {'min': 0.6, 'max': 0.9, 'unit': '%'},
                'image_alt_coverage': {'min': 0.8, 'max': 1.0, 'unit': '%'},
                'keyword_density_score': {'min': 0.7, 'max': 0.9, 'unit': '%'}
            },
            'llm_metrics': {
                'content_readability': {'min': 60, 'max': 80, 'unit': 'score'},
                'semantic_html_usage': {'min': 0.7, 'max': 1.0, 'unit': '%'},
                'content_structure_clarity': {'min': 0.7, 'max': 0.9, 'unit': '%'},
                'entity_recognition_score': {'min': 0.6, 'max': 0.9, 'unit': '%'},
                'context_coherence': {'min': 0.7, 'max': 0.9, 'unit': '%'},
                'information_density': {'min': 0.6, 'max': 0.8, 'unit': '%'},
                'ai_parsability_score': {'min': 0.7, 'max': 0.9, 'unit': '%'}
            },
            'performance_metrics': {
                'page_load_time': {'min': 1.0, 'max': 3.0, 'unit': 's', 'lower_better': True},
                'ttfb': {'min': 0.2, 'max': 0.8, 'unit': 's', 'lower_better': True},
                'fcp': {'min': 0.9, 'max': 1.8, 'unit': 's', 'lower_better': True},
                'lcp': {'min': 1.2, 'max': 2.5, 'unit': 's', 'lower_better': True},
                'cls': {'min': 0.0, 'max': 0.1, 'unit': '', 'lower_better': True},
                'fid': {'min': 0, 'max': 100, 'unit': 'ms', 'lower_better': True},
                'tbt': {'min': 0, 'max': 200, 'unit': 'ms', 'lower_better': True}
            }
        }
    
    def load_test_results(self, before_file: str, after_file: str) -> Tuple[Dict, Dict]:
        """Load before and after test results from JSON files."""
        with open(before_file, 'r') as f:
            before_results = json.load(f)
        
        with open(after_file, 'r') as f:
            after_results = json.load(f)
        
        return before_results, after_results
    
    def calculate_improvements(self, before: Dict, after: Dict) -> Dict[str, Dict]:
        """Calculate improvements across all metric categories."""
        improvements = {}
        
        for category, metrics in self.metric_categories.items():
            improvements[category] = {}
            
            before_category = before.get(category, {})
            after_category = after.get(category, {})
            
            for metric, config in metrics.items():
                before_val = before_category.get(metric, 0)
                after_val = after_category.get(metric, 0)
                
                # Calculate absolute and percentage improvement
                abs_improvement = after_val - before_val
                if before_val != 0:
                    pct_improvement = (abs_improvement / before_val) * 100
                else:
                    pct_improvement = 0 if after_val == 0 else 100
                
                # For metrics where lower is better, invert the improvement
                if config.get('lower_better', False):
                    abs_improvement = -abs_improvement
                    pct_improvement = -pct_improvement
                
                improvements[category][metric] = {
                    'before': before_val,
                    'after': after_val,
                    'absolute_improvement': abs_improvement,
                    'percentage_improvement': pct_improvement,
                    'unit': config['unit']
                }
        
        return improvements
    
    def create_before_after_comparison(self, improvements: Dict) -> plt.Figure:
        """Create a comprehensive before/after comparison chart."""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Before vs After: SEO/LLM/Performance Impact Analysis', 
                     fontsize=16, fontweight='bold')
        
        # SEO Metrics
        self._plot_category_comparison(axes[0, 0], improvements['seo_metrics'], 
                                     'SEO Metrics', 'green')
        
        # LLM Metrics
        self._plot_category_comparison(axes[0, 1], improvements['llm_metrics'], 
                                     'LLM Compatibility', 'blue')
        
        # Performance Metrics
        self._plot_category_comparison(axes[1, 0], improvements['performance_metrics'], 
                                     'Performance Metrics', 'orange')
        
        # Overall Summary
        self._plot_overall_summary(axes[1, 1], improvements)
        
        plt.tight_layout()
        return fig
    
    def _plot_category_comparison(self, ax, category_data: Dict, title: str, color: str):
        """Plot before/after comparison for a specific category."""
        metrics = list(category_data.keys())
        before_vals = [data['before'] for data in category_data.values()]
        after_vals = [data['after'] for data in category_data.values()]
        
        x = np.arange(len(metrics))
        width = 0.35
        
        bars1 = ax.bar(x - width/2, before_vals, width, label='Before', 
                      alpha=0.7, color='lightgray')
        bars2 = ax.bar(x + width/2, after_vals, width, label='After', 
                      alpha=0.8, color=color)
        
        ax.set_xlabel('Metrics')
        ax.set_ylabel('Score')
        ax.set_title(title)
        ax.set_xticks(x)
        ax.set_xticklabels([m.replace('_', ' ').title() for m in metrics], 
                          rotation=45, ha='right')
        ax.legend()
        
        # Add improvement indicators
        for i, (before, after) in enumerate(zip(before_vals, after_vals)):
            improvement = after - before
            if improvement > 0:
                ax.annotate(f'+{improvement:.2f}', 
                           xy=(i + width/2, after), 
                           xytext=(0, 5), textcoords='offset points',
                           ha='center', va='bottom', color='green', fontweight='bold')
            elif improvement < 0:
                ax.annotate(f'{improvement:.2f}', 
                           xy=(i + width/2, after), 
                           xytext=(0, -15), textcoords='offset points',
                           ha='center', va='top', color='red', fontweight='bold')
    
    def _plot_overall_summary(self, ax, improvements: Dict):
        """Plot overall performance summary."""
        categories = ['SEO', 'LLM', 'Performance']
        overall_improvements = []
        
        for category, data in improvements.items():
            # Calculate average percentage improvement for category
            pct_improvements = [metric['percentage_improvement'] for metric in data.values()]
            avg_improvement = np.mean(pct_improvements)
            overall_improvements.append(avg_improvement)
        
        colors = ['green', 'blue', 'orange']
        bars = ax.bar(categories, overall_improvements, color=colors, alpha=0.7)
        
        ax.set_ylabel('Average Improvement (%)')
        ax.set_title('Overall Category Improvements')
        ax.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        
        # Add value labels on bars
        for bar, improvement in zip(bars, overall_improvements):
            height = bar.get_height()
            ax.annotate(f'{improvement:.1f}%',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3 if height >= 0 else -15),
                       textcoords="offset points",
                       ha='center', va='bottom' if height >= 0 else 'top',
                       fontweight='bold')
    
    def create_improvement_heatmap(self, improvements: Dict) -> plt.Figure:
        """Create a heatmap showing improvement percentages across all metrics."""
        fig, ax = plt.subplots(figsize=(14, 10))
        
        # Prepare data for heatmap
        metrics_data = []
        metric_names = []
        category_labels = []
        
        for category, data in improvements.items():
            category_name = category.replace('_', ' ').title().replace('Llm', 'LLM')
            for metric, values in data.items():
                metrics_data.append(values['percentage_improvement'])
                metric_names.append(metric.replace('_', ' ').title())
                category_labels.append(category_name)
        
        # Create DataFrame for better handling
        df = pd.DataFrame({
            'Metric': metric_names,
            'Category': category_labels,
            'Improvement (%)': metrics_data
        })
        
        # Pivot for heatmap
        heatmap_data = df.pivot_table(values='Improvement (%)', 
                                    index='Category', 
                                    columns='Metric', 
                                    fill_value=0)
        
        # Create heatmap
        sns.heatmap(heatmap_data, annot=True, fmt='.1f', cmap='RdYlGn', 
                   center=0, ax=ax, cbar_kws={'label': 'Improvement (%)'})
        
        ax.set_title('Performance Improvement Heatmap', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        return fig
    
    def create_radar_chart(self, improvements: Dict) -> plt.Figure:
        """Create radar chart showing before/after category scores."""
        fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))
        
        categories = ['SEO', 'LLM Compatibility', 'Performance']
        
        # Calculate average scores for each category
        before_scores = []
        after_scores = []
        
        for category_key in ['seo_metrics', 'llm_metrics', 'performance_metrics']:
            category_data = improvements[category_key]
            
            before_avg = np.mean([data['before'] for data in category_data.values()])
            after_avg = np.mean([data['after'] for data in category_data.values()])
            
            # Normalize to 0-100 scale
            before_scores.append(before_avg * 100 if before_avg <= 1 else before_avg)
            after_scores.append(after_avg * 100 if after_avg <= 1 else after_avg)
        
        # Number of variables
        N = len(categories)
        
        # Angles for each category
        angles = [n / float(N) * 2 * np.pi for n in range(N)]
        angles += angles[:1]  # Complete the circle
        
        # Add scores for complete circle
        before_scores += before_scores[:1]
        after_scores += after_scores[:1]
        
        # Plot
        ax.plot(angles, before_scores, 'o-', linewidth=2, label='Before', color='red', alpha=0.7)
        ax.fill(angles, before_scores, alpha=0.25, color='red')
        
        ax.plot(angles, after_scores, 'o-', linewidth=2, label='After', color='green', alpha=0.7)
        ax.fill(angles, after_scores, alpha=0.25, color='green')
        
        # Add category labels
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories)
        
        # Set scale
        ax.set_ylim(0, 100)
        ax.set_yticks([20, 40, 60, 80, 100])
        ax.set_yticklabels(['20%', '40%', '60%', '80%', '100%'])
        
        ax.set_title('Before vs After: Category Performance Radar', 
                    fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc='upper right', bbox_to_anchor=(1.1, 1.0))
        
        return fig
    
    def create_timeline_projection(self, improvements: Dict, months: int = 12) -> plt.Figure:
        """Create a timeline showing projected improvements over time."""
        fig, axes = plt.subplots(3, 1, figsize=(14, 12))
        fig.suptitle('Projected Performance Timeline (Next 12 Months)', 
                     fontsize=16, fontweight='bold')
        
        # Generate timeline
        dates = [datetime.now() + timedelta(days=30*i) for i in range(months + 1)]
        
        categories = [
            ('seo_metrics', 'SEO Score', 'green'),
            ('llm_metrics', 'LLM Compatibility', 'blue'),
            ('performance_metrics', 'Performance Score', 'orange')
        ]
        
        for idx, (category_key, title, color) in enumerate(categories):
            ax = axes[idx]
            
            # Calculate current average score
            category_data = improvements[category_key]
            current_avg = np.mean([data['after'] for data in category_data.values()])
            current_avg = current_avg * 100 if current_avg <= 1 else current_avg
            
            # Project improvements (assume gradual optimization)
            base_score = np.mean([data['before'] for data in category_data.values()])
            base_score = base_score * 100 if base_score <= 1 else base_score
            
            # Create realistic projection curve
            projected_scores = []
            for month in range(months + 1):
                if month == 0:
                    projected_scores.append(current_avg)
                else:
                    # Diminishing returns curve
                    improvement_factor = 1 - np.exp(-month / 6)  # Exponential curve
                    max_possible = 95  # Realistic maximum
                    projected_score = current_avg + (max_possible - current_avg) * improvement_factor * 0.3
                    projected_scores.append(min(projected_score, max_possible))
            
            # Plot projection
            ax.plot(dates, projected_scores, 'o-', color=color, linewidth=2, markersize=4)
            ax.fill_between(dates, projected_scores, alpha=0.3, color=color)
            
            # Add improvement milestones
            milestones = [3, 6, 9, 12]  # months
            for milestone in milestones:
                if milestone < len(projected_scores):
                    score = projected_scores[milestone]
                    ax.annotate(f'{score:.1f}%', 
                               xy=(dates[milestone], score), 
                               xytext=(0, 10), textcoords='offset points',
                               ha='center', va='bottom', 
                               fontweight='bold', color=color)
            
            ax.set_ylabel(f'{title} (%)')
            ax.set_ylim(0, 100)
            ax.grid(True, alpha=0.3)
            
            # Format x-axis
            if idx == len(categories) - 1:
                ax.set_xlabel('Timeline')
                plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
            else:
                ax.set_xticklabels([])
        
        plt.tight_layout()
        return fig
    
    def generate_impact_report(self, improvements: Dict) -> str:
        """Generate a comprehensive text report of the impact analysis."""
        report_lines = [
            "SEO/LLM/Performance Impact Analysis Report",
            "=" * 50,
            f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "EXECUTIVE SUMMARY",
            "-" * 20
        ]
        
        # Calculate overall improvements
        total_improvements = 0
        significant_improvements = 0
        
        for category, data in improvements.items():
            category_name = category.replace('_', ' ').title().replace('Llm', 'LLM')
            avg_improvement = np.mean([metric['percentage_improvement'] 
                                     for metric in data.values()])
            
            report_lines.extend([
                f"{category_name}: {avg_improvement:+.1f}% average improvement",
            ])
            
            total_improvements += avg_improvement
            if avg_improvement > 10:
                significant_improvements += 1
        
        overall_avg = total_improvements / len(improvements)
        report_lines.extend([
            "",
            f"Overall Performance Improvement: {overall_avg:+.1f}%",
            f"Categories with Significant Improvement (>10%): {significant_improvements}",
            "",
            "DETAILED BREAKDOWN",
            "-" * 20
        ])
        
        # Detailed category analysis
        for category, data in improvements.items():
            category_name = category.replace('_', ' ').title().replace('Llm', 'LLM')
            report_lines.extend([
                f"\n{category_name.upper()}:",
                "=" * len(category_name)
            ])
            
            for metric, values in data.items():
                metric_name = metric.replace('_', ' ').title()
                improvement = values['percentage_improvement']
                unit = values['unit']
                
                status = "↗️ IMPROVED" if improvement > 5 else "↘️ DECLINED" if improvement < -5 else "→ STABLE"
                
                report_lines.append(
                    f"  {metric_name}: {values['before']:.2f}{unit} → "
                    f"{values['after']:.2f}{unit} ({improvement:+.1f}%) {status}"
                )
        
        # Recommendations
        report_lines.extend([
            "",
            "KEY RECOMMENDATIONS",
            "-" * 20
        ])
        
        recommendations = self._generate_recommendations(improvements)
        for rec in recommendations:
            report_lines.append(f"• {rec}")
        
        return "\n".join(report_lines)
    
    def _get_metric_recommendation(self, category: str, metric: str) -> str | None:
        """Look up recommendation for a specific metric from the mapping."""
        category_mappings = RECOMMENDATION_MAPPINGS.get(category, {})
        for keyword, recommendation in category_mappings.items():
            if keyword in metric:
                return recommendation
        return None

    def _generate_recommendations(self, improvements: Dict) -> List[str]:
        """Generate actionable recommendations based on the analysis."""
        recommendations = []

        for category, data in improvements.items():
            # Get the 2 worst-performing metrics in this category
            worst_metrics = sorted(
                data.items(),
                key=lambda x: x[1]['percentage_improvement']
            )[:2]

            for metric, values in worst_metrics:
                if values['percentage_improvement'] < 0:
                    rec = self._get_metric_recommendation(category, metric)
                    if rec and rec not in recommendations:
                        recommendations.append(rec)

        # Use default recommendations if no specific issues found
        if not recommendations:
            recommendations = DEFAULT_RECOMMENDATIONS.copy()

        return recommendations[:5]
    
    def save_all_visualizations(self, improvements: Dict, filename_prefix: str = "impact_analysis"):
        """Save all visualization charts to files."""
        # Before/After Comparison
        fig1 = self.create_before_after_comparison(improvements)
        fig1.savefig(self.output_dir / f"{filename_prefix}_comparison.png", 
                    dpi=300, bbox_inches='tight')
        plt.close(fig1)
        
        # Improvement Heatmap
        fig2 = self.create_improvement_heatmap(improvements)
        fig2.savefig(self.output_dir / f"{filename_prefix}_heatmap.png", 
                    dpi=300, bbox_inches='tight')
        plt.close(fig2)
        
        # Radar Chart
        fig3 = self.create_radar_chart(improvements)
        fig3.savefig(self.output_dir / f"{filename_prefix}_radar.png", 
                    dpi=300, bbox_inches='tight')
        plt.close(fig3)
        
        # Timeline Projection
        fig4 = self.create_timeline_projection(improvements)
        fig4.savefig(self.output_dir / f"{filename_prefix}_timeline.png", 
                    dpi=300, bbox_inches='tight')
        plt.close(fig4)
        
        print(f"All visualizations saved to {self.output_dir}/")
    
    def run_full_analysis(self, before_file: str, after_file: str, 
                         output_prefix: str = "impact_analysis"):
        """Run complete impact analysis and save all outputs."""
        # Load data
        before_results, after_results = self.load_test_results(before_file, after_file)
        
        # Calculate improvements
        improvements = self.calculate_improvements(before_results, after_results)
        
        # Generate report
        report = self.generate_impact_report(improvements)
        
        # Save report
        report_file = self.output_dir / f"{output_prefix}_report.txt"
        with open(report_file, 'w') as f:
            f.write(report)
        
        # Save visualizations
        self.save_all_visualizations(improvements, output_prefix)
        
        # Save raw improvements data
        improvements_file = self.output_dir / f"{output_prefix}_data.json"
        with open(improvements_file, 'w') as f:
            json.dump(improvements, f, indent=2)
        
        print(f"Complete impact analysis saved to {self.output_dir}/")
        print(f"Report: {report_file}")
        print("\nExecutive Summary:")
        print("=" * 50)
        
        # Print key findings
        for category, data in improvements.items():
            category_name = category.replace('_', ' ').title().replace('Llm', 'LLM')
            avg_improvement = np.mean([metric['percentage_improvement'] 
                                     for metric in data.values()])
            print(f"{category_name}: {avg_improvement:+.1f}% average improvement")


def main():
    """Example usage of the ImpactAnalyzer."""
    analyzer = ImpactAnalyzer()
    
    # Example data (in practice, these would be real test results)
    sample_before = {
        'seo_metrics': {
            'structured_data_coverage': 0.45,
            'meta_completeness': 0.67,
            'header_hierarchy_score': 0.52,
            'internal_link_density': 0.38,
            'image_alt_coverage': 0.41,
            'keyword_density_score': 0.59
        },
        'llm_metrics': {
            'content_readability': 52.3,
            'semantic_html_usage': 0.43,
            'content_structure_clarity': 0.51,
            'entity_recognition_score': 0.38,
            'context_coherence': 0.47,
            'information_density': 0.44,
            'ai_parsability_score': 0.41
        },
        'performance_metrics': {
            'page_load_time': 4.2,
            'ttfb': 1.1,
            'fcp': 2.3,
            'lcp': 3.8,
            'cls': 0.25,
            'fid': 180,
            'tbt': 350
        }
    }
    
    sample_after = {
        'seo_metrics': {
            'structured_data_coverage': 0.85,
            'meta_completeness': 0.92,
            'header_hierarchy_score': 0.78,
            'internal_link_density': 0.65,
            'image_alt_coverage': 0.88,
            'keyword_density_score': 0.74
        },
        'llm_metrics': {
            'content_readability': 72.5,
            'semantic_html_usage': 0.81,
            'content_structure_clarity': 0.76,
            'entity_recognition_score': 0.69,
            'context_coherence': 0.83,
            'information_density': 0.72,
            'ai_parsability_score': 0.79
        },
        'performance_metrics': {
            'page_load_time': 2.1,
            'ttfb': 0.4,
            'fcp': 1.2,
            'lcp': 2.1,
            'cls': 0.05,
            'fid': 12,
            'tbt': 89
        }
    }
    
    # Save sample data
    with open('sample_before.json', 'w') as f:
        json.dump(sample_before, f, indent=2)
    
    with open('sample_after.json', 'w') as f:
        json.dump(sample_after, f, indent=2)
    
    # Run analysis
    analyzer.run_full_analysis('sample_before.json', 'sample_after.json', 
                              'sample_impact_analysis')


if __name__ == "__main__":
    main()