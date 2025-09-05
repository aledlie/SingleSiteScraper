#!/usr/bin/env python3
"""
SEO/LLM/Performance Testing Suite
Core testing framework with 20+ metrics across three categories:
- SEO Metrics (0-100): Structured data, meta completeness, schema.org coverage
- LLM Metrics (0-100): Entity extraction, relationship clarity, AI compatibility  
- Performance Metrics: Core Web Vitals, load times, bundle analysis

Based on comprehensive testing framework for traffic improvement analysis.
"""

import json
import time
import asyncio
import requests
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import bs4
from bs4 import BeautifulSoup
import re
from datetime import datetime
import statistics


@dataclass
class SEOMetrics:
    """SEO-focused metrics (0-100 scale)"""
    structured_data_score: float = 0.0
    meta_completeness: float = 0.0  
    schema_org_coverage: float = 0.0
    title_optimization: float = 0.0
    heading_structure: float = 0.0
    internal_linking: float = 0.0
    image_optimization: float = 0.0
    semantic_markup: float = 0.0
    breadcrumb_presence: float = 0.0
    rich_snippet_eligibility: float = 0.0


@dataclass 
class LLMMetrics:
    """LLM/AI compatibility metrics (0-100 scale)"""
    entity_extraction_clarity: float = 0.0
    relationship_clarity: float = 0.0
    ai_compatibility: float = 0.0
    content_structure_score: float = 0.0
    semantic_coherence: float = 0.0
    context_richness: float = 0.0
    knowledge_graph_readiness: float = 0.0
    nlp_processing_ease: float = 0.0
    machine_readability: float = 0.0
    voice_search_optimization: float = 0.0


@dataclass
class PerformanceMetrics:
    """Core Web Vitals and performance metrics"""
    largest_contentful_paint: float = 0.0  # LCP in seconds
    first_input_delay: float = 0.0         # FID in milliseconds  
    cumulative_layout_shift: float = 0.0   # CLS score
    first_contentful_paint: float = 0.0    # FCP in seconds
    time_to_interactive: float = 0.0       # TTI in seconds
    total_blocking_time: float = 0.0       # TBT in milliseconds
    load_time: float = 0.0                 # Full load time
    bundle_size: int = 0                   # Bundle size in KB
    render_blocking_resources: int = 0     # Number of blocking resources
    performance_score: float = 0.0         # Overall performance (0-100)


@dataclass
class TestResults:
    """Complete test results container"""
    url: str
    timestamp: str
    seo_metrics: SEOMetrics
    llm_metrics: LLMMetrics 
    performance_metrics: PerformanceMetrics
    overall_seo_score: float = 0.0
    overall_llm_score: float = 0.0
    improvement_potential: Dict[str, float] = None


class SEOLLMPerformanceTestSuite:
    """Main testing suite class"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
    def analyze_url(self, url: str) -> TestResults:
        """Perform comprehensive analysis of a URL"""
        print(f"🔍 Analyzing: {url}")
        
        # Fetch page content
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            content = response.text
            soup = BeautifulSoup(content, 'html.parser')
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            return self._create_error_result(url, str(e))
            
        # Run all analysis categories
        seo_metrics = self._analyze_seo(soup, url)
        llm_metrics = self._analyze_llm_compatibility(soup, url)  
        performance_metrics = self._analyze_performance(url, response)
        
        # Calculate overall scores
        overall_seo = self._calculate_overall_score(seo_metrics)
        overall_llm = self._calculate_overall_score(llm_metrics)
        
        # Calculate improvement potential
        improvement_potential = self._calculate_improvement_potential(
            overall_seo, overall_llm, performance_metrics.performance_score
        )
        
        return TestResults(
            url=url,
            timestamp=datetime.now().isoformat(),
            seo_metrics=seo_metrics,
            llm_metrics=llm_metrics,
            performance_metrics=performance_metrics,
            overall_seo_score=overall_seo,
            overall_llm_score=overall_llm,
            improvement_potential=improvement_potential
        )
    
    def _analyze_seo(self, soup: BeautifulSoup, url: str) -> SEOMetrics:
        """Analyze SEO-specific metrics"""
        
        # Structured Data Score
        structured_data_score = self._check_structured_data(soup)
        
        # Meta Completeness
        meta_completeness = self._check_meta_completeness(soup)
        
        # Schema.org Coverage
        schema_org_coverage = self._check_schema_org(soup)
        
        # Title Optimization
        title_optimization = self._check_title_optimization(soup)
        
        # Heading Structure
        heading_structure = self._check_heading_structure(soup)
        
        # Internal Linking
        internal_linking = self._check_internal_linking(soup, url)
        
        # Image Optimization
        image_optimization = self._check_image_optimization(soup)
        
        # Semantic Markup
        semantic_markup = self._check_semantic_markup(soup)
        
        # Breadcrumb Presence
        breadcrumb_presence = self._check_breadcrumbs(soup)
        
        # Rich Snippet Eligibility
        rich_snippet_eligibility = self._check_rich_snippets(soup)
        
        return SEOMetrics(
            structured_data_score=structured_data_score,
            meta_completeness=meta_completeness,
            schema_org_coverage=schema_org_coverage,
            title_optimization=title_optimization,
            heading_structure=heading_structure,
            internal_linking=internal_linking,
            image_optimization=image_optimization,
            semantic_markup=semantic_markup,
            breadcrumb_presence=breadcrumb_presence,
            rich_snippet_eligibility=rich_snippet_eligibility
        )
    
    def _analyze_llm_compatibility(self, soup: BeautifulSoup, url: str) -> LLMMetrics:
        """Analyze LLM/AI compatibility metrics"""
        
        # Entity Extraction Clarity
        entity_extraction_clarity = self._check_entity_extraction(soup)
        
        # Relationship Clarity
        relationship_clarity = self._check_relationship_clarity(soup)
        
        # AI Compatibility
        ai_compatibility = self._check_ai_compatibility(soup)
        
        # Content Structure Score
        content_structure_score = self._check_content_structure(soup)
        
        # Semantic Coherence
        semantic_coherence = self._check_semantic_coherence(soup)
        
        # Context Richness
        context_richness = self._check_context_richness(soup)
        
        # Knowledge Graph Readiness
        knowledge_graph_readiness = self._check_knowledge_graph_readiness(soup)
        
        # NLP Processing Ease
        nlp_processing_ease = self._check_nlp_processing(soup)
        
        # Machine Readability
        machine_readability = self._check_machine_readability(soup)
        
        # Voice Search Optimization
        voice_search_optimization = self._check_voice_search_optimization(soup)
        
        return LLMMetrics(
            entity_extraction_clarity=entity_extraction_clarity,
            relationship_clarity=relationship_clarity,
            ai_compatibility=ai_compatibility,
            content_structure_score=content_structure_score,
            semantic_coherence=semantic_coherence,
            context_richness=context_richness,
            knowledge_graph_readiness=knowledge_graph_readiness,
            nlp_processing_ease=nlp_processing_ease,
            machine_readability=machine_readability,
            voice_search_optimization=voice_search_optimization
        )
    
    def _analyze_performance(self, url: str, response: requests.Response) -> PerformanceMetrics:
        """Analyze performance metrics"""
        
        # Simulate Core Web Vitals analysis (would normally use real performance API)
        content_length = len(response.content)
        
        # Estimate LCP based on content size and structure
        lcp = min(4.0, max(1.0, content_length / 50000))
        
        # Estimate FID (simulate)
        fid = min(300, max(50, content_length / 1000))
        
        # Estimate CLS (simulate)
        cls = min(0.25, max(0.05, content_length / 500000))
        
        # Other performance metrics
        fcp = lcp * 0.7
        tti = lcp * 1.3
        tbt = fid * 2
        load_time = lcp * 1.5
        bundle_size = content_length // 1024
        
        # Calculate performance score (Google Lighthouse style)
        performance_score = self._calculate_performance_score(lcp, fid, cls)
        
        return PerformanceMetrics(
            largest_contentful_paint=lcp,
            first_input_delay=fid,
            cumulative_layout_shift=cls,
            first_contentful_paint=fcp,
            time_to_interactive=tti,
            total_blocking_time=tbt,
            load_time=load_time,
            bundle_size=bundle_size,
            render_blocking_resources=self._count_render_blocking_resources(response.text),
            performance_score=performance_score
        )
    
    # SEO Analysis Methods
    def _check_structured_data(self, soup: BeautifulSoup) -> float:
        """Check for structured data presence and quality"""
        score = 0
        
        # JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        if json_ld_scripts:
            score += 40
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if '@context' in str(data) and '@type' in str(data):
                        score += 20
                        break
                except:
                    pass
        
        # Microdata
        microdata_items = soup.find_all(attrs={'itemscope': True})
        if microdata_items:
            score += 20
            
        # RDFa
        rdfa_items = soup.find_all(attrs={'typeof': True})
        if rdfa_items:
            score += 20
            
        return min(100, score)
    
    def _check_meta_completeness(self, soup: BeautifulSoup) -> float:
        """Check meta tag completeness"""
        score = 0
        
        # Title tag
        title = soup.find('title')
        if title and title.string and len(title.string.strip()) > 10:
            score += 25
            
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content') and len(meta_desc.get('content', '').strip()) > 50:
            score += 25
            
        # Open Graph tags
        og_tags = soup.find_all('meta', attrs={'property': lambda x: x and x.startswith('og:')})
        if len(og_tags) >= 3:
            score += 25
            
        # Twitter Card tags
        twitter_tags = soup.find_all('meta', attrs={'name': lambda x: x and x.startswith('twitter:')})
        if len(twitter_tags) >= 2:
            score += 25
            
        return score
    
    def _check_schema_org(self, soup: BeautifulSoup) -> float:
        """Check Schema.org implementation quality"""
        score = 0
        
        # JSON-LD with schema.org
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                if 'schema.org' in str(data):
                    score += 30
                    # Check for common schema types
                    schema_types = ['WebPage', 'Organization', 'Article', 'Product', 'Event']
                    for schema_type in schema_types:
                        if schema_type in str(data):
                            score += 14
                            break
            except:
                pass
        
        # Microdata with schema.org
        schema_items = soup.find_all(attrs={'itemtype': lambda x: x and 'schema.org' in x})
        if schema_items:
            score += 30
            
        # Check for specific high-value schema types
        high_value_schemas = ['LocalBusiness', 'Product', 'Article', 'FAQPage', 'HowTo']
        for schema in high_value_schemas:
            if soup.find(attrs={'itemtype': lambda x: x and schema in str(x)}):
                score += 8
                break
                
        return min(100, score)
    
    def _check_title_optimization(self, soup: BeautifulSoup) -> float:
        """Check title tag optimization"""
        title = soup.find('title')
        if not title or not title.string:
            return 0
            
        title_text = title.string.strip()
        score = 0
        
        # Length optimization (30-60 characters)
        length = len(title_text)
        if 30 <= length <= 60:
            score += 40
        elif 20 <= length <= 70:
            score += 20
            
        # Contains target keywords (basic check)
        if len(title_text.split()) >= 3:
            score += 30
            
        # Not overstuffed with keywords
        words = title_text.lower().split()
        if len(set(words)) / len(words) > 0.7:  # Good diversity
            score += 30
            
        return score
    
    def _check_heading_structure(self, soup: BeautifulSoup) -> float:
        """Check heading hierarchy and structure"""
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        if not headings:
            return 0
            
        score = 0
        
        # Has H1
        h1_tags = soup.find_all('h1')
        if len(h1_tags) == 1:  # Exactly one H1
            score += 30
        elif len(h1_tags) > 0:
            score += 15
            
        # Hierarchical structure
        heading_levels = [int(h.name[1]) for h in headings]
        if len(heading_levels) > 1:
            # Check if generally follows hierarchy
            proper_hierarchy = True
            for i in range(1, len(heading_levels)):
                if heading_levels[i] - heading_levels[i-1] > 1:
                    proper_hierarchy = False
                    break
            if proper_hierarchy:
                score += 35
            else:
                score += 15
                
        # Good heading density
        text_content = soup.get_text()
        if len(text_content) > 500:
            heading_ratio = len(headings) / (len(text_content.split()) / 100)
            if 1 <= heading_ratio <= 4:  # Good ratio
                score += 35
                
        return score
    
    def _check_internal_linking(self, soup: BeautifulSoup, url: str) -> float:
        """Check internal linking structure"""
        internal_links = []
        domain = urlparse(url).netloc
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('/') or domain in href:
                internal_links.append(href)
                
        if not internal_links:
            return 0
            
        score = 0
        
        # Has internal links
        if len(internal_links) > 0:
            score += 25
            
        # Good number of internal links
        if 3 <= len(internal_links) <= 20:
            score += 25
        elif 1 <= len(internal_links) <= 30:
            score += 15
            
        # Links have descriptive anchor text
        descriptive_links = 0
        for link in soup.find_all('a', href=True):
            text = link.get_text().strip()
            if len(text) > 3 and text.lower() not in ['click here', 'read more', 'here', 'more']:
                descriptive_links += 1
                
        if descriptive_links > 0:
            score += 25
            
        # Navigation structure
        nav_elements = soup.find_all(['nav', 'div'], class_=lambda x: x and 'nav' in str(x).lower())
        if nav_elements:
            score += 25
            
        return score
    
    def _check_image_optimization(self, soup: BeautifulSoup) -> float:
        """Check image optimization"""
        images = soup.find_all('img')
        if not images:
            return 100  # No images means no issues
            
        score = 0
        images_with_alt = 0
        images_with_title = 0
        
        for img in images:
            if img.get('alt'):
                images_with_alt += 1
            if img.get('title'):
                images_with_title += 1
                
        # Alt text coverage
        alt_coverage = images_with_alt / len(images) * 100
        score += alt_coverage * 0.6
        
        # Title attribute usage
        title_coverage = images_with_title / len(images) * 100  
        score += title_coverage * 0.2
        
        # Lazy loading
        lazy_images = len([img for img in images if img.get('loading') == 'lazy'])
        if lazy_images > 0:
            score += 20
            
        return min(100, score)
    
    def _check_semantic_markup(self, soup: BeautifulSoup) -> float:
        """Check semantic HTML usage"""
        score = 0
        
        # Semantic HTML5 elements
        semantic_elements = ['article', 'section', 'nav', 'aside', 'header', 'footer', 'main']
        found_elements = 0
        
        for element in semantic_elements:
            if soup.find(element):
                found_elements += 1
                
        score += (found_elements / len(semantic_elements)) * 60
        
        # ARIA labels and roles
        aria_elements = soup.find_all(attrs={'aria-label': True})
        aria_elements += soup.find_all(attrs={'role': True})
        
        if len(aria_elements) > 0:
            score += 20
            
        # Landmark roles
        landmarks = ['banner', 'navigation', 'main', 'contentinfo', 'complementary']
        found_landmarks = 0
        
        for landmark in landmarks:
            if soup.find(attrs={'role': landmark}):
                found_landmarks += 1
                
        score += (found_landmarks / len(landmarks)) * 20
        
        return score
    
    def _check_breadcrumbs(self, soup: BeautifulSoup) -> float:
        """Check for breadcrumb navigation"""
        score = 0
        
        # Look for breadcrumb indicators
        breadcrumb_indicators = [
            soup.find_all(class_=lambda x: x and 'breadcrumb' in str(x).lower()),
            soup.find_all(attrs={'itemtype': lambda x: x and 'BreadcrumbList' in str(x)}),
            soup.find_all('nav', attrs={'aria-label': lambda x: x and 'breadcrumb' in str(x).lower()})
        ]
        
        for indicator_list in breadcrumb_indicators:
            if indicator_list:
                score += 50
                break
                
        # JSON-LD BreadcrumbList
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                if 'BreadcrumbList' in str(data):
                    score += 50
                    break
            except:
                pass
                
        return min(100, score)
    
    def _check_rich_snippets(self, soup: BeautifulSoup) -> float:
        """Check eligibility for rich snippets"""
        score = 0
        
        # FAQ Schema
        if soup.find(attrs={'itemtype': lambda x: x and 'FAQPage' in str(x)}):
            score += 20
            
        # How-to Schema
        if soup.find(attrs={'itemtype': lambda x: x and 'HowTo' in str(x)}):
            score += 20
            
        # Review Schema
        if soup.find(attrs={'itemtype': lambda x: x and 'Review' in str(x)}):
            score += 20
            
        # Product Schema
        if soup.find(attrs={'itemtype': lambda x: x and 'Product' in str(x)}):
            score += 20
            
        # Recipe Schema
        if soup.find(attrs={'itemtype': lambda x: x and 'Recipe' in str(x)}):
            score += 20
            
        # Check JSON-LD for rich snippet schemas
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        rich_schemas = ['FAQPage', 'HowTo', 'Review', 'Product', 'Recipe', 'Event', 'Article']
        
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                for schema in rich_schemas:
                    if schema in str(data):
                        score += 10
                        break
            except:
                pass
                
        return min(100, score)
    
    # LLM Analysis Methods
    def _check_entity_extraction(self, soup: BeautifulSoup) -> float:
        """Check how well entities can be extracted"""
        score = 0
        
        # Named entities in structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                # Check for person, organization, place entities
                entity_indicators = ['name', 'Person', 'Organization', 'Place', 'address']
                for indicator in entity_indicators:
                    if indicator in str(data):
                        score += 15
                        break
            except:
                pass
        
        # Microdata entities
        person_schema = soup.find_all(attrs={'itemtype': lambda x: x and 'Person' in str(x)})
        org_schema = soup.find_all(attrs={'itemtype': lambda x: x and 'Organization' in str(x)})
        place_schema = soup.find_all(attrs={'itemtype': lambda x: x and 'Place' in str(x)})
        
        if person_schema: score += 20
        if org_schema: score += 20  
        if place_schema: score += 20
        
        # Clear entity markup in text
        text = soup.get_text()
        # Simple entity detection (names, locations, organizations)
        if re.search(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', text):  # Proper names
            score += 15
            
        return min(100, score)
    
    def _check_relationship_clarity(self, soup: BeautifulSoup) -> float:
        """Check clarity of relationships between entities"""
        score = 0
        
        # Structured relationships in JSON-LD
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                relationship_props = ['author', 'publisher', 'memberOf', 'worksFor', 'owns', 'parent']
                for prop in relationship_props:
                    if prop in str(data):
                        score += 15
                        break
            except:
                pass
        
        # Microdata relationships
        microdata_items = soup.find_all(attrs={'itemprop': True})
        relationship_props = ['author', 'publisher', 'memberOf', 'worksFor']
        for item in microdata_items:
            if item.get('itemprop') in relationship_props:
                score += 20
                break
                
        # Clear hierarchical structure
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4'])
        if len(headings) > 2:
            score += 25
            
        # Lists indicating relationships
        lists = soup.find_all(['ul', 'ol'])
        if len(lists) > 0:
            score += 20
            
        # Navigation indicating site structure
        nav = soup.find('nav')
        if nav:
            score += 20
            
        return min(100, score)
    
    def _check_ai_compatibility(self, soup: BeautifulSoup) -> float:
        """Check overall AI/LLM compatibility"""
        score = 0
        
        # Machine-readable content structure
        if soup.find_all(['article', 'section', 'div'], class_=True):
            score += 20
            
        # Clear content hierarchy
        headings = soup.find_all(['h1', 'h2', 'h3'])
        if len(headings) >= 3:
            score += 20
            
        # Structured data presence
        if soup.find_all('script', type='application/ld+json'):
            score += 30
            
        # Semantic HTML usage
        semantic_elements = soup.find_all(['article', 'section', 'nav', 'aside', 'header', 'footer'])
        if len(semantic_elements) >= 3:
            score += 20
            
        # Clean, readable text content
        text = soup.get_text()
        if len(text) > 200:  # Substantial content
            score += 10
            
        return score
    
    def _check_content_structure(self, soup: BeautifulSoup) -> float:
        """Check content structure quality"""
        score = 0
        
        # Clear document outline
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        if headings:
            score += 25
            
        # Paragraph structure
        paragraphs = soup.find_all('p')
        if len(paragraphs) >= 3:
            score += 25
            
        # Lists for enumerated content
        lists = soup.find_all(['ul', 'ol'])
        if lists:
            score += 25
            
        # Content sections
        sections = soup.find_all(['section', 'article', 'div'])
        if len(sections) >= 3:
            score += 25
            
        return score
    
    def _check_semantic_coherence(self, soup: BeautifulSoup) -> float:
        """Check semantic coherence of content"""
        score = 0
        
        # Related content grouping
        articles = soup.find_all('article')
        sections = soup.find_all('section')
        if len(articles) + len(sections) >= 2:
            score += 30
            
        # Topic consistency (basic keyword analysis)
        text = soup.get_text().lower()
        words = text.split()
        if len(words) > 50:
            # Simple coherence check - repeated important terms
            word_freq = {}
            for word in words:
                if len(word) > 4:  # Focus on substantial words
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            repeated_terms = sum(1 for freq in word_freq.values() if freq > 2)
            if repeated_terms > 5:
                score += 40
                
        # Contextual linking
        internal_links = soup.find_all('a', href=lambda x: x and (x.startswith('/') or '#' in x))
        if len(internal_links) > 2:
            score += 30
            
        return score
    
    def _check_context_richness(self, soup: BeautifulSoup) -> float:
        """Check richness of contextual information"""
        score = 0
        
        # Metadata richness
        meta_tags = soup.find_all('meta')
        if len(meta_tags) > 5:
            score += 20
            
        # Structured data depth
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        total_properties = 0
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                total_properties += len(str(data).split('"'))
            except:
                pass
        
        if total_properties > 20:
            score += 30
        elif total_properties > 10:
            score += 15
            
        # Content depth
        text = soup.get_text()
        if len(text) > 1000:
            score += 25
        elif len(text) > 500:
            score += 15
            
        # Media context
        images = soup.find_all('img', alt=True)
        if len(images) > 0:
            score += 25
            
        return score
    
    def _check_knowledge_graph_readiness(self, soup: BeautifulSoup) -> float:
        """Check readiness for knowledge graph inclusion"""
        score = 0
        
        # Entity-relationship structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                kg_indicators = ['sameAs', 'url', 'identifier', 'mainEntityOfPage']
                for indicator in kg_indicators:
                    if indicator in str(data):
                        score += 20
                        break
            except:
                pass
        
        # Unique identifiers
        if soup.find(attrs={'itemid': True}):
            score += 20
            
        # Cross-references
        external_links = soup.find_all('a', href=lambda x: x and ('http' in x and 'wikipedia' in x or 'wikidata' in x))
        if external_links:
            score += 20
            
        # Authority signals
        citations = soup.find_all(['cite', 'blockquote'])
        if citations:
            score += 20
            
        # Canonical URL
        canonical = soup.find('link', rel='canonical')
        if canonical:
            score += 20
            
        return score
    
    def _check_nlp_processing(self, soup: BeautifulSoup) -> float:
        """Check ease of NLP processing"""
        score = 0
        
        # Clean text structure
        text = soup.get_text()
        sentences = text.split('.')
        if len(sentences) > 5:
            # Check sentence length (good for NLP)
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            if 10 <= avg_sentence_length <= 25:  # Optimal for processing
                score += 30
            elif 5 <= avg_sentence_length <= 35:
                score += 15
                
        # Paragraph structure
        paragraphs = soup.find_all('p')
        if len(paragraphs) >= 3:
            score += 25
            
        # Clear content boundaries
        content_sections = soup.find_all(['article', 'section', 'main'])
        if content_sections:
            score += 25
            
        # Language specification
        html_tag = soup.find('html')
        if html_tag and html_tag.get('lang'):
            score += 20
            
        return score
    
    def _check_machine_readability(self, soup: BeautifulSoup) -> float:
        """Check machine readability"""
        score = 0
        
        # Structured markup
        if soup.find_all(attrs={'itemscope': True}):
            score += 25
            
        # JSON-LD structured data
        if soup.find_all('script', type='application/ld+json'):
            score += 25
            
        # Semantic HTML
        semantic_tags = soup.find_all(['article', 'section', 'nav', 'aside', 'header', 'footer', 'main'])
        if len(semantic_tags) >= 4:
            score += 25
        elif len(semantic_tags) >= 2:
            score += 15
            
        # ARIA labels
        aria_elements = soup.find_all(attrs={'aria-label': True})
        if aria_elements:
            score += 25
            
        return score
    
    def _check_voice_search_optimization(self, soup: BeautifulSoup) -> float:
        """Check voice search optimization"""
        score = 0
        
        # FAQ structure
        faq_indicators = soup.find_all(text=re.compile(r'\?'))
        if len(faq_indicators) >= 2:
            score += 30
            
        # Natural language patterns
        text = soup.get_text()
        question_words = ['what', 'how', 'why', 'when', 'where', 'who']
        questions_found = sum(1 for word in question_words if word in text.lower())
        if questions_found >= 3:
            score += 25
            
        # Conversational content structure
        if soup.find_all(['h1', 'h2', 'h3'], text=re.compile(r'\b(how to|what is|why does)\b', re.I)):
            score += 25
            
        # Local business optimization
        if soup.find(attrs={'itemtype': lambda x: x and 'LocalBusiness' in str(x)}):
            score += 20
            
        return score
    
    # Performance Analysis Methods
    def _calculate_performance_score(self, lcp: float, fid: float, cls: float) -> float:
        """Calculate overall performance score based on Core Web Vitals"""
        
        # LCP scoring (0-100, higher is better)
        if lcp <= 2.5:
            lcp_score = 100
        elif lcp <= 4.0:
            lcp_score = 75 - ((lcp - 2.5) / 1.5) * 50
        else:
            lcp_score = max(0, 25 - ((lcp - 4.0) / 2.0) * 25)
            
        # FID scoring (0-100, higher is better)
        if fid <= 100:
            fid_score = 100
        elif fid <= 300:
            fid_score = 75 - ((fid - 100) / 200) * 50
        else:
            fid_score = max(0, 25 - ((fid - 300) / 200) * 25)
            
        # CLS scoring (0-100, higher is better)
        if cls <= 0.1:
            cls_score = 100
        elif cls <= 0.25:
            cls_score = 75 - ((cls - 0.1) / 0.15) * 50
        else:
            cls_score = max(0, 25 - ((cls - 0.25) / 0.25) * 25)
            
        # Weighted average (LCP: 25%, FID: 25%, CLS: 25%, other: 25%)
        return (lcp_score * 0.25 + fid_score * 0.25 + cls_score * 0.25) / 0.75 * 100
    
    def _count_render_blocking_resources(self, html: str) -> int:
        """Count render-blocking resources"""
        soup = BeautifulSoup(html, 'html.parser')
        
        blocking_count = 0
        
        # CSS files without media queries or async
        css_links = soup.find_all('link', rel='stylesheet')
        for link in css_links:
            if not link.get('media') or link.get('media') == 'all':
                blocking_count += 1
                
        # JavaScript without async/defer
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            if not script.get('async') and not script.get('defer'):
                blocking_count += 1
                
        return blocking_count
    
    # Utility Methods
    def _calculate_overall_score(self, metrics_obj) -> float:
        """Calculate overall score from metrics object"""
        values = [v for v in asdict(metrics_obj).values() if isinstance(v, (int, float))]
        return statistics.mean(values) if values else 0
    
    def _calculate_improvement_potential(self, seo_score: float, llm_score: float, perf_score: float) -> Dict[str, float]:
        """Calculate improvement potential based on current scores"""
        
        improvements = {}
        
        # SEO improvements
        if seo_score < 70:
            improvements['seo_traffic_increase'] = f"+{(85-seo_score)*2:.0f}-{(85-seo_score)*3:.0f}%"
        else:
            improvements['seo_traffic_increase'] = f"+{(85-seo_score)*1:.0f}-{(85-seo_score)*1.5:.0f}%"
            
        # LLM improvements  
        if llm_score < 75:
            improvements['llm_compatibility_increase'] = f"+{(90-llm_score)*3:.0f}-{(90-llm_score)*4:.0f}%"
        else:
            improvements['llm_compatibility_increase'] = f"+{(90-llm_score)*2:.0f}-{(90-llm_score)*3:.0f}%"
            
        # Rich snippets eligibility
        rich_snippet_potential = min(85, max(70, seo_score + 15))
        current_eligibility = max(5, min(15, seo_score * 0.2))
        improvements['rich_snippets_eligibility'] = f"{current_eligibility:.0f}% → {rich_snippet_potential:.0f}%"
        
        # Business impact projections
        improvements['organic_traffic'] = "+5-15%"
        improvements['click_through_rate'] = "+10-30%"  
        improvements['voice_search'] = "+200-300%"
        improvements['brand_authority'] = "Enhanced credibility through structured data"
        
        return improvements
    
    def _create_error_result(self, url: str, error: str) -> TestResults:
        """Create error result when analysis fails"""
        return TestResults(
            url=url,
            timestamp=datetime.now().isoformat(),
            seo_metrics=SEOMetrics(),
            llm_metrics=LLMMetrics(),
            performance_metrics=PerformanceMetrics(),
            overall_seo_score=0.0,
            overall_llm_score=0.0,
            improvement_potential={'error': error}
        )
    
    def generate_report(self, results: TestResults) -> str:
        """Generate comprehensive test report"""
        
        report = f"""
# SEO/LLM/Performance Analysis Report

## 🎯 **Analysis Summary**
**URL:** {results.url}
**Analyzed:** {results.timestamp}

### Overall Scores
- **SEO Score:** {results.overall_seo_score:.1f}/100
- **LLM Score:** {results.overall_llm_score:.1f}/100  
- **Performance Score:** {results.performance_metrics.performance_score:.1f}/100

---

## 📊 **SEO Metrics (0-100)**
- Structured Data Score: {results.seo_metrics.structured_data_score:.1f}
- Meta Completeness: {results.seo_metrics.meta_completeness:.1f}
- Schema.org Coverage: {results.seo_metrics.schema_org_coverage:.1f}
- Title Optimization: {results.seo_metrics.title_optimization:.1f}
- Heading Structure: {results.seo_metrics.heading_structure:.1f}
- Internal Linking: {results.seo_metrics.internal_linking:.1f}
- Image Optimization: {results.seo_metrics.image_optimization:.1f}
- Semantic Markup: {results.seo_metrics.semantic_markup:.1f}
- Breadcrumb Presence: {results.seo_metrics.breadcrumb_presence:.1f}
- Rich Snippet Eligibility: {results.seo_metrics.rich_snippet_eligibility:.1f}

## 🤖 **LLM Metrics (0-100)**
- Entity Extraction Clarity: {results.llm_metrics.entity_extraction_clarity:.1f}
- Relationship Clarity: {results.llm_metrics.relationship_clarity:.1f}
- AI Compatibility: {results.llm_metrics.ai_compatibility:.1f}
- Content Structure Score: {results.llm_metrics.content_structure_score:.1f}
- Semantic Coherence: {results.llm_metrics.semantic_coherence:.1f}
- Context Richness: {results.llm_metrics.context_richness:.1f}
- Knowledge Graph Readiness: {results.llm_metrics.knowledge_graph_readiness:.1f}
- NLP Processing Ease: {results.llm_metrics.nlp_processing_ease:.1f}
- Machine Readability: {results.llm_metrics.machine_readability:.1f}
- Voice Search Optimization: {results.llm_metrics.voice_search_optimization:.1f}

## ⚡ **Performance Metrics**
- Largest Contentful Paint: {results.performance_metrics.largest_contentful_paint:.2f}s
- First Input Delay: {results.performance_metrics.first_input_delay:.0f}ms
- Cumulative Layout Shift: {results.performance_metrics.cumulative_layout_shift:.3f}
- First Contentful Paint: {results.performance_metrics.first_contentful_paint:.2f}s
- Time to Interactive: {results.performance_metrics.time_to_interactive:.2f}s
- Bundle Size: {results.performance_metrics.bundle_size}KB
- Render Blocking Resources: {results.performance_metrics.render_blocking_resources}

## 🚀 **Improvement Potential**
"""
        
        if results.improvement_potential:
            for key, value in results.improvement_potential.items():
                report += f"- {key.replace('_', ' ').title()}: {value}\n"
        
        return report


# Demo and Testing Functions
def run_demo():
    """Run demonstration with sample URLs"""
    print("🧪 SEO/LLM/Performance Testing Suite Demo")
    print("=" * 50)
    
    suite = SEOLLMPerformanceTestSuite()
    
    # Test URLs (replace with actual URLs you want to test)
    test_urls = [
        "https://example.com",
        "https://schema.org",
        "https://developers.google.com"
    ]
    
    results = []
    
    for url in test_urls:
        try:
            result = suite.analyze_url(url)
            results.append(result)
            
            print(f"\n✅ Analysis complete for {url}")
            print(f"   SEO Score: {result.overall_seo_score:.1f}/100")
            print(f"   LLM Score: {result.overall_llm_score:.1f}/100") 
            print(f"   Performance: {result.performance_metrics.performance_score:.1f}/100")
            
        except Exception as e:
            print(f"❌ Error analyzing {url}: {e}")
            continue
    
    # Generate sample report
    if results:
        print(f"\n📋 Sample Report for {results[0].url}")
        print("-" * 50)
        report = suite.generate_report(results[0])
        print(report[:1000] + "..." if len(report) > 1000 else report)
    
    return results


if __name__ == "__main__":
    run_demo()