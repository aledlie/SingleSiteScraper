import { parse, HTMLElement } from 'node-html-parser';

export interface HTMLObject {
  id: string;
  type: string;
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  position: {
    depth: number;
    index: number;
    parent?: string;
  };
  relationships: string[];
  semanticRole?: string;
  schemaOrgType?: string;
  performance: {
    loadTime?: number;
    renderTime?: number;
    size: number;
  };
}

export interface HTMLRelationship {
  id: string;
  source: string;
  target: string;
  type: 'parent-child' | 'sibling' | 'reference' | 'semantic' | 'navigation' | 'content';
  strength: number;
  metadata: Record<string, any>;
}

export interface HTMLGraph {
  objects: Map<string, HTMLObject>;
  relationships: HTMLRelationship[];
  metadata: {
    url: string;
    title: string;
    analyzedAt: string;
    totalObjects: number;
    totalRelationships: number;
    performance: {
      analysisTime: number;
      complexity: number;
    };
  };
}

export class HTMLObjectAnalyzer {
  private idCounter = 0;
  
  private generateId(prefix: string = 'obj'): string {
    return `${prefix}_${++this.idCounter}`;
  }

  private getSemanticRole(element: HTMLElement): string | undefined {
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const classNames = element.getAttribute('class') || '';
    
    // Schema.org detection
    const itemType = element.getAttribute('itemtype');
    if (itemType) {
      return itemType.split('/').pop() || 'structured-data';
    }

    // Semantic HTML
    const semanticTags = {
      'header': 'header',
      'nav': 'navigation',
      'main': 'main-content',
      'article': 'article',
      'section': 'section',
      'aside': 'complementary',
      'footer': 'footer',
      'h1': 'heading-1',
      'h2': 'heading-2',
      'h3': 'heading-3',
      'form': 'form',
      'button': 'button',
      'input': 'input',
      'a': 'link',
      'img': 'image',
      'video': 'media',
      'audio': 'media',
      'table': 'tabular-data'
    };

    if (role) return role;
    if (semanticTags[tag]) return semanticTags[tag];
    
    // Class-based heuristics
    if (classNames.includes('menu') || classNames.includes('nav')) return 'navigation';
    if (classNames.includes('modal') || classNames.includes('dialog')) return 'dialog';
    if (classNames.includes('carousel') || classNames.includes('slider')) return 'carousel';
    if (classNames.includes('card')) return 'card';
    if (classNames.includes('button') || classNames.includes('btn')) return 'button';

    return undefined;
  }

  private getSchemaOrgType(element: HTMLElement): string | undefined {
    const itemType = element.getAttribute('itemtype');
    if (itemType) {
      return itemType.replace('https://schema.org/', '').replace('http://schema.org/', '');
    }

    // JSON-LD detection in nearby script tags
    const parent = element.parentNode;
    if (parent) {
      const scripts = (parent as HTMLElement).querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type']) {
            return data['@type'];
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    return undefined;
  }

  private calculateElementSize(element: HTMLElement): number {
    const text = element.textContent || '';
    const attributes = Object.entries(element.attributes || {});
    const attributeSize = attributes.reduce((size, [key, value]) => size + key.length + value.length, 0);
    return text.length + attributeSize + element.outerHTML.length;
  }

  private analyzeElement(
    element: HTMLElement, 
    depth: number, 
    index: number, 
    parentId?: string
  ): HTMLObject {
    const id = this.generateId();
    const tag = element.tagName.toLowerCase();
    const attributes: Record<string, string> = {};
    
    // Extract all attributes
    if (element.attributes) {
      Object.entries(element.attributes).forEach(([key, value]) => {
        attributes[key] = value;
      });
    }

    const htmlObject: HTMLObject = {
      id,
      type: this.classifyElement(element),
      tag,
      attributes,
      text: element.textContent?.trim(),
      position: {
        depth,
        index,
        parent: parentId
      },
      relationships: [],
      semanticRole: this.getSemanticRole(element),
      schemaOrgType: this.getSchemaOrgType(element),
      performance: {
        size: this.calculateElementSize(element)
      }
    };

    return htmlObject;
  }

  private classifyElement(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    // const classNames = element.getAttribute('class') || '';  // For future use
    // const id = element.getAttribute('id') || '';  // For future use

    // Interactive elements
    if (['button', 'input', 'select', 'textarea', 'a'].includes(tag)) {
      return 'interactive';
    }

    // Media elements
    if (['img', 'video', 'audio', 'canvas', 'svg'].includes(tag)) {
      return 'media';
    }

    // Structural elements
    if (['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'].includes(tag)) {
      return 'structural';
    }

    // Content elements
    if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th'].includes(tag)) {
      return 'content';
    }

    // Data elements
    if (['table', 'ul', 'ol', 'dl'].includes(tag)) {
      return 'data';
    }

    // Form elements
    if (['form', 'fieldset', 'legend', 'label'].includes(tag)) {
      return 'form';
    }

    return 'other';
  }

  private createRelationships(objects: Map<string, HTMLObject>): HTMLRelationship[] {
    const relationships: HTMLRelationship[] = [];
    let relationshipId = 0;

    for (const [objectId, object] of objects) {
      // Parent-child relationships
      if (object.position.parent) {
        relationships.push({
          id: `rel_${++relationshipId}`,
          source: object.position.parent,
          target: objectId,
          type: 'parent-child',
          strength: 1.0,
          metadata: {
            depth: object.position.depth,
            index: object.position.index
          }
        });
      }

      // Reference relationships (links, form references, etc.)
      if (object.attributes.href) {
        // Find target by href
        for (const [targetId, targetObj] of objects) {
          if (targetObj.attributes.id === object.attributes.href.substring(1)) {
            relationships.push({
              id: `rel_${++relationshipId}`,
              source: objectId,
              target: targetId,
              type: 'reference',
              strength: 0.8,
              metadata: {
                referenceType: 'href',
                value: object.attributes.href
              }
            });
          }
        }
      }

      // Form relationships
      if (object.attributes.for) {
        for (const [targetId, targetObj] of objects) {
          if (targetObj.attributes.id === object.attributes.for) {
            relationships.push({
              id: `rel_${++relationshipId}`,
              source: objectId,
              target: targetId,
              type: 'semantic',
              strength: 0.9,
              metadata: {
                relationship: 'label-for',
                formControl: targetObj.tag
              }
            });
          }
        }
      }

      // Sibling relationships (same parent, similar type)
      const siblings = Array.from(objects.values()).filter(obj => 
        obj.position.parent === object.position.parent && 
        obj.id !== objectId &&
        obj.type === object.type
      );

      for (const sibling of siblings) {
        relationships.push({
          id: `rel_${++relationshipId}`,
          source: objectId,
          target: sibling.id,
          type: 'sibling',
          strength: 0.6,
          metadata: {
            commonParent: object.position.parent,
            sharedType: object.type
          }
        });
      }

      // Navigation relationships
      if (object.semanticRole === 'navigation' || object.tag === 'nav') {
        const navLinks = Array.from(objects.values()).filter(obj => 
          obj.tag === 'a' && 
          obj.position.parent === objectId
        );

        for (const link of navLinks) {
          relationships.push({
            id: `rel_${++relationshipId}`,
            source: objectId,
            target: link.id,
            type: 'navigation',
            strength: 0.9,
            metadata: {
              navType: 'contains-link',
              linkText: link.text
            }
          });
        }
      }
    }

    return relationships;
  }

  public analyzeHTML(html: string, url: string = ''): HTMLGraph {
    const startTime = Date.now();
    const root = parse(html);
    const objects = new Map<string, HTMLObject>();
    
    // Recursively analyze elements
    const analyzeRecursive = (element: HTMLElement, depth: number = 0, index: number = 0, parentId?: string) => {
      const htmlObject = this.analyzeElement(element, depth, index, parentId);
      objects.set(htmlObject.id, htmlObject);

      // Analyze children
      const children = element.childNodes.filter(node => node.nodeType === 1) as HTMLElement[];
      children.forEach((child, childIndex) => {
        analyzeRecursive(child, depth + 1, childIndex, htmlObject.id);
      });
    };

    // Start analysis from body or root
    const body = root.querySelector('body') || root;
    analyzeRecursive(body);

    // Create relationships
    const relationships = this.createRelationships(objects);

    // Update object relationships
    for (const relationship of relationships) {
      const sourceObj = objects.get(relationship.source);
      const targetObj = objects.get(relationship.target);
      
      if (sourceObj && !sourceObj.relationships.includes(relationship.target)) {
        sourceObj.relationships.push(relationship.target);
      }
      if (targetObj && !targetObj.relationships.includes(relationship.source)) {
        targetObj.relationships.push(relationship.source);
      }
    }

    const analysisTime = Date.now() - startTime;
    const complexity = this.calculateComplexity(objects, relationships);

    return {
      objects,
      relationships,
      metadata: {
        url,
        title: root.querySelector('title')?.textContent || 'Untitled',
        analyzedAt: new Date().toISOString(),
        totalObjects: objects.size,
        totalRelationships: relationships.length,
        performance: {
          analysisTime,
          complexity
        }
      }
    };
  }

  private calculateComplexity(objects: Map<string, HTMLObject>, relationships: HTMLRelationship[]): number {
    const objectCount = objects.size;
    const relationshipCount = relationships.length;
    const maxDepth = Math.max(...Array.from(objects.values()).map(obj => obj.position.depth));
    
    // Complexity formula: considers elements, relationships, and depth
    return Math.round((objectCount * 0.3 + relationshipCount * 0.4 + maxDepth * 10) * 100) / 100;
  }

  public exportToGraphML(graph: HTMLGraph): string {
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  
  <!-- Attribute definitions -->
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="tag" for="node" attr.name="tag" attr.type="string"/>
  <key id="semanticRole" for="node" attr.name="semanticRole" attr.type="string"/>
  <key id="schemaOrgType" for="node" attr.name="schemaOrgType" attr.type="string"/>
  <key id="size" for="node" attr.name="size" attr.type="int"/>
  <key id="depth" for="node" attr.name="depth" attr.type="int"/>
  <key id="relationshipType" for="edge" attr.name="type" attr.type="string"/>
  <key id="strength" for="edge" attr.name="strength" attr.type="double"/>

  <graph id="html-graph" edgedefault="directed">
`;

    // Add nodes
    for (const [id, obj] of graph.objects) {
      graphml += `    <node id="${id}">
      <data key="type">${obj.type}</data>
      <data key="tag">${obj.tag}</data>
      <data key="semanticRole">${obj.semanticRole || ''}</data>
      <data key="schemaOrgType">${obj.schemaOrgType || ''}</data>
      <data key="size">${obj.performance.size}</data>
      <data key="depth">${obj.position.depth}</data>
    </node>
`;
    }

    // Add edges
    for (const rel of graph.relationships) {
      graphml += `    <edge source="${rel.source}" target="${rel.target}">
      <data key="relationshipType">${rel.type}</data>
      <data key="strength">${rel.strength}</data>
    </edge>
`;
    }

    graphml += `  </graph>
</graphml>`;

    return graphml;
  }

  public generateSchemaOrgData(graph: HTMLGraph): Record<string, any> {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "url": graph.metadata.url,
      "name": graph.metadata.title,
      "dateModified": graph.metadata.analyzedAt,
      "mainEntity": {
        "@type": "StructuredValue",
        "description": "HTML Object Analysis",
        "value": {
          "totalObjects": graph.metadata.totalObjects,
          "totalRelationships": graph.metadata.totalRelationships,
          "complexity": graph.metadata.performance.complexity,
          "analysisTime": graph.metadata.performance.analysisTime
        }
      },
      "hasPart": [] as any[]
    };

    // Add schema.org objects found in the page
    for (const [id, obj] of graph.objects) {
      if (obj.schemaOrgType) {
        schemaData.hasPart.push({
          "@type": obj.schemaOrgType,
          "identifier": id,
          "name": obj.text || obj.tag,
          "additionalType": obj.semanticRole
        });
      }
    }

    return schemaData;
  }
}