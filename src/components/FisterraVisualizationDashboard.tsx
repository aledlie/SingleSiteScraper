import React, { useState, useEffect } from 'react';
import { BarChart3, Network, Globe, Activity, Download, Eye, TrendingUp } from 'lucide-react';
import { WordCloudViz } from '../visualizations/WordCloudViz';
import { NetworkGraphViz } from '../visualizations/NetworkGraphViz';
import { MetricsCharts } from '../visualizations/MetricsCharts';
import { EnhancedScraper } from '../analytics/enhancedScraper';
import { HTMLObjectAnalyzer } from '../analytics/htmlObjectAnalyzer';

// Mock data based on typical fisterra.org content structure
const createFisterraMockData = () => {
  // Simulate scraped text content from Fisterra (medical information portal)
  const mockTextContent = [
    "Fisterra es una herramienta de ayuda a la toma de decisiones clínicas dirigida al profesional sanitario",
    "Medicina basada en evidencia",
    "Guías clínicas",
    "Algoritmos diagnósticos", 
    "Información para pacientes",
    "Herramientas de consulta",
    "Calculadoras médicas",
    "Protocolos asistenciales",
    "Formación médica continuada",
    "Recursos sanitarios",
    "Atención primaria",
    "Especialidades médicas",
    "Diagnóstico diferencial",
    "Tratamientos farmacológicos",
    "Medicina preventiva",
    "Salud pública",
    "Epidemiología",
    "Investigación clínica",
    "Telemedicina",
    "Sistemas sanitarios"
  ];

  // Generate word frequency data
  const wordFrequency = new Map();
  mockTextContent.forEach(text => {
    text.split(/\s+/).forEach(word => {
      const cleanWord = word.replace(/[^\w\sáéíóúüñ]/gi, '').toLowerCase();
      if (cleanWord.length > 3) {
        wordFrequency.set(cleanWord, (wordFrequency.get(cleanWord) || 0) + 1);
      }
    });
  });

  const wordData = Array.from(wordFrequency.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);

  // Create mock HTML graph structure
  const htmlAnalyzer = new HTMLObjectAnalyzer();
  
  // Simulate Fisterra's complex medical portal structure
  const mockHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <title>Fisterra - Ayuda a la toma de decisiones clínicas</title>
      <meta name="description" content="Portal médico con guías clínicas y herramientas diagnósticas">
      <meta name="keywords" content="medicina, guías clínicas, diagnóstico, atención primaria">
    </head>
    <body>
      <header role="banner">
        <nav role="navigation" itemscope itemtype="https://schema.org/SiteNavigationElement">
          <a href="/" itemtype="https://schema.org/Organization">Fisterra</a>
          <ul>
            <li><a href="/guias-clinicas">Guías Clínicas</a></li>
            <li><a href="/algoritmos">Algoritmos</a></li>
            <li><a href="/calculadoras">Calculadoras</a></li>
            <li><a href="/formacion">Formación</a></li>
          </ul>
        </nav>
      </header>
      
      <main role="main">
        <section itemscope itemtype="https://schema.org/MedicalWebPage">
          <header>
            <h1>Portal de Medicina Basada en Evidencia</h1>
            <p>Herramientas para profesionales sanitarios</p>
          </header>
          
          <article itemscope itemtype="https://schema.org/MedicalGuideline">
            <h2>Guías Clínicas Actualizadas</h2>
            <div class="clinical-guidelines">
              <div class="guideline-card" itemscope itemtype="https://schema.org/MedicalCondition">
                <h3 itemprop="name">Hipertensión Arterial</h3>
                <p itemprop="description">Protocolo diagnóstico y terapéutico</p>
                <a href="/guia/hipertension" class="btn-primary">Ver Guía</a>
              </div>
              <div class="guideline-card" itemscope itemtype="https://schema.org/MedicalCondition">
                <h3 itemprop="name">Diabetes Mellitus</h3>
                <p itemprop="description">Manejo integral del paciente diabético</p>
                <a href="/guia/diabetes" class="btn-primary">Ver Guía</a>
              </div>
            </div>
          </article>
          
          <section class="diagnostic-tools">
            <h2>Herramientas Diagnósticas</h2>
            <form class="calculator-form" role="form">
              <fieldset>
                <legend>Calculadora de Riesgo Cardiovascular</legend>
                <label for="age">Edad:</label>
                <input type="number" id="age" name="age" min="18" max="100">
                <label for="systolic">Tensión Sistólica:</label>
                <input type="number" id="systolic" name="systolic">
                <button type="submit" class="btn-calculate">Calcular</button>
              </fieldset>
            </form>
          </section>
          
          <aside class="patient-info" role="complementary">
            <h3>Información para Pacientes</h3>
            <ul>
              <li><a href="/pacientes/hipertension">Hipertensión: Qué debe saber</a></li>
              <li><a href="/pacientes/diabetes">Diabetes: Cuidados esenciales</a></li>
              <li><a href="/pacientes/medicamentos">Uso correcto de medicamentos</a></li>
            </ul>
          </aside>
        </section>
      </main>
      
      <footer role="contentinfo" itemscope itemtype="https://schema.org/Organization">
        <div class="footer-content">
          <p itemprop="name">Fisterra.com</p>
          <p itemprop="description">Portal médico de referencia</p>
          <address>
            <span itemprop="address">A Coruña, España</span>
            <a href="mailto:info@fisterra.com" itemprop="email">info@fisterra.com</a>
          </address>
        </div>
      </footer>
      
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        "name": "Fisterra - Portal Médico",
        "description": "Herramientas de ayuda a la toma de decisiones clínicas",
        "provider": {
          "@type": "Organization",
          "name": "Fisterra.com"
        }
      }
      </script>
    </body>
    </html>
  `;

  const htmlGraph = htmlAnalyzer.analyzeHTML(mockHTML, 'https://fisterra.org');

  // Create mock performance metrics
  const performanceMetrics = {
    id: 'fisterra_analysis_001',
    url: 'https://fisterra.org',
    timestamp: new Date().toISOString(),
    scraping: {
      totalTime: 3450,
      fetchTime: 1200,
      parseTime: 650,
      analysisTime: 1600,
      retryAttempts: 0,
      proxyUsed: 'Direct'
    },
    content: {
      htmlSize: mockHTML.length,
      objectCount: htmlGraph.metadata.totalObjects,
      relationshipCount: htmlGraph.metadata.totalRelationships,
      complexity: htmlGraph.metadata.performance.complexity,
      maxDepth: Math.max(...Array.from(htmlGraph.objects.values()).map(obj => obj.position.depth))
    },
    network: {
      responseTime: 1200,
      contentLength: mockHTML.length,
      contentType: 'text/html; charset=utf-8',
      statusCode: 200
    },
    quality: {
      successRate: 1.0,
      dataCompleteness: 0.95,
      errorCount: 0,
      warningCount: 2
    }
  };

  return {
    wordData,
    htmlGraph,
    performanceMetrics,
    mockHTML
  };
};

export const FisterraVisualizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wordcloud' | 'network' | 'metrics'>('overview');
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Simulate loading and processing data
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate API delay with cleanup
      await new Promise<void>(resolve => {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            resolve();
          }
        }, 1500);
      });
      
      const mockData = createFisterraMockData();
      setData(mockData);

      // Generate insights using the enhanced scraper
      const scraper = new EnhancedScraper();
      const mockResult = {
        originalData: {
          title: 'Fisterra - Portal Médico',
          description: 'Herramientas de ayuda a la toma de decisiones clínicas',
          text: ['Medicina basada en evidencia', 'Guías clínicas', 'Algoritmos diagnósticos'],
          links: [{ text: 'Guías Clínicas', url: '/guias-clinicas' }],
          images: [{ src: '/logo.png', alt: 'Fisterra Logo' }],
          metadata: { language: 'es', keywords: 'medicina, guías clínicas' },
          events: [],
          status: { success: true, responseTime: 1200 }
        },
        htmlGraph: mockData.htmlGraph,
        performanceMetrics: mockData.performanceMetrics,
        url: 'https://fisterra.org'
      };

      const generatedInsights = scraper.generateInsights(mockResult);
      setInsights(generatedInsights);
      
      setIsLoading(false);
    };

    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg shadow-sm border border-gray-200">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          Analyzing Fisterra.org
        </h2>
        <p style={{ color: '#6b7280', textAlign: 'center' }}>
          Processing website structure and generating insights...
        </p>
      </div>
    );
  }

  if (!data || !insights) {
    return (
      <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Failed to load visualization data</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye, description: 'Complete dashboard overview' },
    { id: 'wordcloud', label: 'Word Analysis', icon: BarChart3, description: 'Content word frequency' },
    { id: 'network', label: 'Network Graph', icon: Network, description: 'HTML structure relationships' },
    { id: 'metrics', label: 'Detailed Metrics', icon: TrendingUp, description: 'Performance and quality analytics' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-5 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Globe className="w-8 h-8 text-blue-600" />
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Fisterra.org Analysis
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Comprehensive website structure and content analysis
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {data.htmlGraph.metadata.totalObjects}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>HTML Elements</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {data.htmlGraph.metadata.totalRelationships}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Relationships</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {data.wordData.length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Unique Terms</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {(data.performanceMetrics.scraping.totalTime / 1000).toFixed(1)}s
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Processing Time</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white rounded-xl p-2 mb-6 border border-gray-200 shadow-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                border: 'none',
                background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px'
              }}
            >
              <Icon className="w-5 h-5 mb-2" />
              <span style={{ fontWeight: '500' }}>{tab.label}</span>
              <span style={{ 
                fontSize: '11px', 
                opacity: 0.8,
                marginTop: '2px' 
              }}>
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="">
        {activeTab === 'overview' && (
          <div className="">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Word Cloud Preview */}
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Content Word Cloud
                </h3>
                <WordCloudViz words={data.wordData.slice(0, 25)} width={400} height={250} />
              </div>

              {/* Network Graph Preview */}
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Network className="w-5 h-5 text-green-600" />
                  HTML Structure Graph
                </h3>
                <NetworkGraphViz graph={data.htmlGraph} width={400} height={250} />
              </div>
            </div>

            {/* Metrics Preview */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Key Insights
              </h3>
              <MetricsCharts 
                insights={insights} 
                performanceMetrics={data.performanceMetrics}
              />
            </div>
          </div>
        )}

        {activeTab === 'wordcloud' && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                Content Word Analysis
              </h2>
              <button
                onClick={() => {
                  const canvas = document.querySelector('.word-cloud-canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = 'fisterra-wordcloud.png';
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Download className="w-4 h-4" />
                Export Image
              </button>
            </div>
            <WordCloudViz words={data.wordData} width={1000} height={600} />
            
            {/* Word List */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Top Keywords
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {data.wordData.slice(0, 20).map((word: any, index: number) => (
                  <div key={word.text} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontWeight: '500' }}>{word.text}</span>
                    <span style={{ color: '#6b7280' }}>{word.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                HTML Structure Network
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const graphML = data.htmlGraph ? 
                      new HTMLObjectAnalyzer().exportToGraphML(data.htmlGraph) : '';
                    const blob = new Blob([graphML], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'fisterra-graph.graphml';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export GraphML
                </button>
              </div>
            </div>
            <NetworkGraphViz graph={data.htmlGraph} width={1200} height={700} />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                Detailed Performance & Quality Metrics
              </h2>
              <button
                onClick={() => {
                  const exportData = {
                    insights,
                    performanceMetrics: data.performanceMetrics,
                    timestamp: new Date().toISOString(),
                    url: 'https://fisterra.org'
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'fisterra-metrics.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
            <MetricsCharts 
              insights={insights} 
              performanceMetrics={data.performanceMetrics}
            />
          </div>
        )}
      </div>
    </div>
  );
};