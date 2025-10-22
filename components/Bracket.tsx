import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { BracketData, BracketNode } from '../types';

interface BracketProps {
  data: BracketData;
  highlightedPlayer: string | null;
  onHighlightPlayer: (playerName: string | null) => void;
  searchQuery: string;
}

const HIGHLIGHT_COLOR = '#A78BFA'; // Tailwind violet-400
const BASE_STROKE_COLOR = '#4A5568';
const WINNER_STROKE_COLOR = '#48BB78';
const BG_COLOR = '#2D3748';
const SCORE_COLOR = '#A0AEC0';
const DIM_OPACITY = 0.2;

export const Bracket: React.FC<BracketProps> = ({ data, highlightedPlayer, onHighlightPlayer, searchQuery }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // FIX: The type `d3.ZoomTransform` may be causing a TypeScript error due to faulty type definitions in `@types/d3`.
  // Using `any` as a pragmatic workaround to ensure compilation without affecting runtime behavior.
  const transformRef = useRef<any>();


  useEffect(() => {
    if (!data || !svgRef.current) return;

    const { main: mainBracketRoot, thirdPlace: thirdPlaceMatch } = data;

    const margin = { top: 20, right: 180, bottom: 20, left: 180 };
    const nodeWidth = 360; // Increased width for scores and final score
    const nodeHeight = 60;
    
    const root = d3.hierarchy(mainBracketRoot, d => d.children);
    const numLeaves = root.leaves().length;
    const height = numLeaves * (nodeHeight + 30);
    const width = (root.height + 1) * 400;

    const treeLayout = d3.tree<BracketNode>().size([height, width]);
    treeLayout(root);

    // Flip the tree horizontally so Round 1 is on the left and Final is on the right
    root.each(d => {
        d.y = width - d.y;
    });

    // --- Search Path Logic ---
    const searchPathNodeIds = new Set<string>();
    const searchPathLinkIds = new Set<string>();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (normalizedQuery) {
        const matchingNodes = root.leaves().filter(d => 
            (d.data.player1 && d.data.player1.toLowerCase().includes(normalizedQuery)) ||
            (d.data.player2 && d.data.player2.toLowerCase().includes(normalizedQuery))
        );

        matchingNodes.forEach(startNode => {
            let currentNode: d3.HierarchyNode<BracketNode> | null = startNode;
            while(currentNode) {
                searchPathNodeIds.add(currentNode.data.id);
                const parent = currentNode.parent;
                if(parent) {
                    const linkId = `${parent.data.id}-${currentNode.data.id}`;
                    searchPathLinkIds.add(linkId);
                }
                currentNode = parent;
            }
        });
        
        if (
            (thirdPlaceMatch.player1 && thirdPlaceMatch.player1.toLowerCase().includes(normalizedQuery)) ||
            (thirdPlaceMatch.player2 && thirdPlaceMatch.player2.toLowerCase().includes(normalizedQuery))
        ) {
            searchPathNodeIds.add(thirdPlaceMatch.id);
        }
    }
    
    // --- Highlight Path Logic ---
    const highlightPathNodeIds = new Set<string>();
    const highlightPathLinkIds = new Set<string>();

    if (highlightedPlayer) {
      let currentNode = root.leaves().find(d =>
        d.data.player1 === highlightedPlayer || d.data.player2 === highlightedPlayer
      );

      if (currentNode) {
        while (currentNode) {
          highlightPathNodeIds.add(currentNode.data.id);
          if (currentNode.data.winner && currentNode.data.winner !== highlightedPlayer) break;
          const parent = currentNode.parent;
          if (!parent) break;
          const linkId = `${parent.data.id}-${currentNode.data.id}`;
          highlightPathLinkIds.add(linkId);
          currentNode = parent;
        }
      }
      
      if (thirdPlaceMatch.player1 === highlightedPlayer || thirdPlaceMatch.player2 === highlightedPlayer) {
          highlightPathNodeIds.add(thirdPlaceMatch.id);
      }
    }

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style('cursor', 'move')
      .html('');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        transformRef.current = event.transform;
      });
      
    svg.call(zoom);

    if (transformRef.current) {
        svg.call(zoom.transform, transformRef.current);
    }


    // Links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', d => {
        const linkId = `${d.source.data.id}-${d.target.data.id}`;
        return highlightPathLinkIds.has(linkId) ? HIGHLIGHT_COLOR : BASE_STROKE_COLOR;
      })
      .attr('stroke-width', d => {
        const linkId = `${d.source.data.id}-${d.target.data.id}`;
        return highlightPathLinkIds.has(linkId) ? 3 : 2;
      })
      .style('opacity', d => {
        if (!normalizedQuery) return 1;
        const linkId = `${d.source.data.id}-${d.target.data.id}`;
        return searchPathLinkIds.has(linkId) ? 1 : DIM_OPACITY;
      })
      .attr('d', d => {
          // Parent (source) is on the right, child (target) is on the left
          const startX = d.source.y;
          const startY = d.source.x;
          const endX = d.target.y + nodeWidth;
          const endY = d.target.x;
          return `M${startX},${startY} C${startX - 100},${startY} ${endX + 100},${endY} ${endX},${endY}`;
      });

    // Nodes
    const node = g.selectAll('.node')
      .data(root.descendants().reverse())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x - nodeHeight / 2})`)
      .style('opacity', d => (!normalizedQuery || searchPathNodeIds.has(d.data.id)) ? 1 : DIM_OPACITY);

    node.append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('fill', BG_COLOR)
      .attr('stroke', d => highlightPathNodeIds.has(d.data.id) ? HIGHLIGHT_COLOR : (d.data.winner ? WINNER_STROKE_COLOR : BASE_STROKE_COLOR))
      .attr('stroke-width', d => highlightPathNodeIds.has(d.data.id) ? 3 : 2)
      .attr('rx', 4);
      
    const renderPlayerRow = (
        selection: d3.Selection<d3.BaseType, d3.HierarchyNode<BracketNode>, SVGGElement, unknown>,
        player: 'player1' | 'player2',
        scoreKey: 'player1Score' | 'player2Score',
        setsWonKey: 'player1SetsWon' | 'player2SetsWon',
        yPos: number
    ) => {
      // Player Name
      selection.append('text')
        .attr('x', 10)
        .attr('y', yPos)
        .attr('dy', '.35em')
        .attr('fill', d => d.data[player] === highlightedPlayer ? '#F7FAFC' : '#A0AEC0')
        .style('font-weight', d => d.data[player] === highlightedPlayer ? 'bold' : 'normal')
        .style('font-size', '14px')
        .style('cursor', d => (d.data[player] && d.data[player] !== 'BYE') ? 'pointer' : 'default')
        .text(d => d.data[player] || 'TBD')
        .on('click', (event, d) => {
            event.stopPropagation();
            if (d.data[player] && d.data[player] !== 'BYE') {
                onHighlightPlayer(d.data[player]);
            }
        });
      
      // Final Score (Sets Won)
      selection.append('text')
          .attr('x', nodeWidth - 20)
          .attr('y', yPos)
          .attr('dy', '.35em')
          .attr('text-anchor', 'end')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .attr('fill', SCORE_COLOR)
          .text(d => d.data[setsWonKey] ?? '');


      // Individual Set Scores
      selection.each(function (d) {
        const scores = d.data[scoreKey];
        if (scores) {
            scores.forEach((score, i) => {
                d3.select(this).append('text')
                    .attr('x', nodeWidth - 55 - (i * 28))
                    .attr('y', yPos)
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'end')
                    .style('font-size', '12px')
                    .attr('fill', SCORE_COLOR)
                    .text(score);
            });
        }
      });
    };

    renderPlayerRow(node, 'player1', 'player1Score', 'player1SetsWon', 22);
    renderPlayerRow(node, 'player2', 'player2Score', 'player2SetsWon', nodeHeight - 22);

    // Divider for final score
    node.append('line')
      .attr('x1', nodeWidth - 42)
      .attr('y1', 5)
      .attr('x2', nodeWidth - 42)
      .attr('y2', nodeHeight - 5)
      .attr('stroke', BASE_STROKE_COLOR)
      .attr('stroke-width', 1);

    node.append('line')
      .attr('x1', 5)
      .attr('y1', nodeHeight / 2)
      .attr('x2', nodeWidth - 5)
      .attr('y2', nodeHeight / 2)
      .attr('stroke', BASE_STROKE_COLOR)
      .attr('stroke-width', 1);

    node.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .attr('fill', '#718096')
      .text(d => `Round ${d.data.round} - Match ${d.data.matchInRound}`);
      
    // --- 3rd Place Match ---
    const finalNodeData = root.descendants().find(d => d.depth === 0);
    if(finalNodeData) {
        const thirdPlaceX = finalNodeData.y;
        const thirdPlaceY = finalNodeData.x + nodeHeight * 2;

        const thirdPlaceNode = g.append('g')
            .attr('class', 'node third-place')
            .attr('transform', `translate(${thirdPlaceX},${thirdPlaceY - nodeHeight / 2})`)
            .style('opacity', (!normalizedQuery || searchPathNodeIds.has(thirdPlaceMatch.id)) ? 1 : DIM_OPACITY);

        thirdPlaceNode.append('rect')
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .attr('fill', BG_COLOR)
            .attr('stroke', highlightPathNodeIds.has(thirdPlaceMatch.id) ? HIGHLIGHT_COLOR : (thirdPlaceMatch.winner ? WINNER_STROKE_COLOR : BASE_STROKE_COLOR))
            .attr('stroke-width', highlightPathNodeIds.has(thirdPlaceMatch.id) ? 3 : 2)
            .attr('rx', 4);

        const renderThirdPlacePlayerRow = (player: 'player1' | 'player2', scoreKey: 'player1Score' | 'player2Score', setsWonKey: 'player1SetsWon' | 'player2SetsWon', yPos: number, placeholder: string) => {
            // Name
            thirdPlaceNode.append('text')
                .attr('x', 10)
                .attr('y', yPos)
                .attr('dy', '.35em')
                .attr('fill', thirdPlaceMatch[player] === highlightedPlayer ? '#F7FAFC' : '#A0AEC0')
                .style('font-weight', thirdPlaceMatch[player] === highlightedPlayer ? 'bold' : 'normal')
                .style('font-size', '14px')
                .style('cursor', thirdPlaceMatch[player] ? 'pointer' : 'default')
                .text(thirdPlaceMatch[player] || placeholder)
                .on('click', (event) => {
                    event.stopPropagation();
                    if (thirdPlaceMatch[player]) {
                        onHighlightPlayer(thirdPlaceMatch[player]);
                    }
                });

            // Final Score
             thirdPlaceNode.append('text')
                .attr('x', nodeWidth - 20)
                .attr('y', yPos)
                .attr('dy', '.35em')
                .attr('text-anchor', 'end')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .attr('fill', SCORE_COLOR)
                .text(thirdPlaceMatch[setsWonKey] ?? '');

            // Scores
            const scores = thirdPlaceMatch[scoreKey];
            if (scores) {
                scores.forEach((score, i) => {
                    thirdPlaceNode.append('text')
                        .attr('x', nodeWidth - 55 - (i * 28))
                        .attr('y', yPos)
                        .attr('dy', '.35em')
                        .attr('text-anchor', 'end')
                        .style('font-size', '12px')
                        .attr('fill', SCORE_COLOR)
                        .text(score);
                });
            }
        };
        
        renderThirdPlacePlayerRow('player1', 'player1Score', 'player1SetsWon', 22, 'Loser SF1');
        renderThirdPlacePlayerRow('player2', 'player2Score', 'player2SetsWon', nodeHeight - 22, 'Loser SF2');
        
        thirdPlaceNode.append('line')
          .attr('x1', nodeWidth - 42)
          .attr('y1', 5)
          .attr('x2', nodeWidth - 42)
          .attr('y2', nodeHeight - 5)
          .attr('stroke', BASE_STROKE_COLOR)
          .attr('stroke-width', 1);

        thirdPlaceNode.append('line')
            .attr('x1', 5)
            .attr('y1', nodeHeight / 2)
            .attr('x2', nodeWidth - 5)
            .attr('y2', nodeHeight / 2)
            .attr('stroke', BASE_STROKE_COLOR);

        thirdPlaceNode.append('text')
            .attr('x', nodeWidth / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .attr('fill', '#718096')
            .text('3rd Place Final');
    }

  }, [data, highlightedPlayer, onHighlightPlayer, searchQuery]);

  return <svg ref={svgRef}></svg>;
};
