import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, FileCode, MessageSquare, AlertTriangle, ShieldCheck, CornerDownRight } from 'lucide-react';

interface Comment {
  id: number;
  lineNumber: number;
  filePath: string;
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  commentText: string;
}

interface PRReview {
  id: number;
  repoName: string;
  prNumber: number;
  title: string;
  author: string;
  createdAt: string;
  status: string;
  comments: Comment[];
  diffs: {
    filePath: string;
    diffHunk: string;
  }[];
}

export const HistoryView: React.FC = () => {
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<{ [prId: number]: number }>({});

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/v1/reviews/history');
      if (response.ok) {
        setReviews(await response.json());
      }
    } catch (e) {
      console.warn('Backend offline, loaded detailed review files into demo state.', e);
      // Load premium interactive demo data
      setReviews([
        {
          id: 1,
          repoName: 'spring-petclinic',
          prNumber: 104,
          title: 'Upgrade to Spring Security 6.2 and implement JWT checks',
          author: 'alex_dev',
          createdAt: '2026-06-04 13:42:15',
          status: 'ACTION_POSTED',
          diffs: [
            {
              filePath: 'src/main/java/org/springframework/samples/petclinic/security/JwtTokenProvider.java',
              diffHunk: `@@ -15,7 +15,11 @@ public class JwtTokenProvider {
     private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
 
-    private String secretKey = "mySecretKeyForSigningPetclinicJWTTokensNeedsToBeLongerThanThisString";
+    @Value("\${jwt.secret-key}")
+    private String secretKey;
 
     public String createToken(Authentication authentication) {
-        return Jwts.builder().setSubject(authentication.getName()).signWith(SignatureAlgorithm.HS256, secretKey).compact();
+        Date now = new Date();
+        Date validity = new Date(now.getTime() + 3600000); // 1 hour
+        return Jwts.builder()
+            .setSubject(authentication.getName())
+            .setIssuedAt(now)
+            .setExpiration(validity)
+            .signWith(SignatureAlgorithm.HS512, secretKey)
+            .compact();
     }`
            },
            {
              filePath: 'src/main/java/org/springframework/samples/petclinic/owner/OwnerController.java',
              diffHunk: `@@ -82,6 +82,7 @@ public class OwnerController {
     @GetMapping("/owners/{ownerId}")
     public ModelAndView showOwner(@PathVariable("ownerId") int ownerId) {
         ModelAndView mav = new ModelAndView("owners/ownerDetails");
-        mav.addObject(this.owners.findById(ownerId));
+        Owner owner = this.owners.findById(ownerId);
+        if (owner == null) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner Not Found"); }
+        mav.addObject(owner);
         return mav;
     }`
            }
          ],
          comments: [
            {
              id: 101,
              lineNumber: 22,
              filePath: 'src/main/java/org/springframework/samples/petclinic/security/JwtTokenProvider.java',
              category: 'Security Risk',
              severity: 'CRITICAL',
              commentText: 'Great move importing this value from configuration instead of hardcoding. Ensure jwt.secret-key in application.properties is excluded from repository version control.'
            },
            {
              id: 102,
              lineNumber: 28,
              filePath: 'src/main/java/org/springframework/samples/petclinic/security/JwtTokenProvider.java',
              category: 'Security Risk',
              severity: 'WARNING',
              commentText: 'HS512 requires a secret key size of at least 512 bits (64 characters). If the injected secretKey is shorter, the application will throw a WeakKeyException at runtime.'
            }
          ]
        },
        {
          id: 2,
          repoName: 'react-dashboard',
          prNumber: 42,
          title: 'Implement custom hook for websocket connections',
          author: 'lisa_frontend',
          createdAt: '2026-06-03 10:15:30',
          status: 'ACTION_POSTED',
          diffs: [
            {
              filePath: 'src/hooks/useWebSocket.ts',
              diffHunk: `@@ -8,8 +8,15 @@ export const useWebSocket = (url: string) => {
   useEffect(() => {
-    const ws = new WebSocket(url);
-    ws.onmessage = (event) => setData(JSON.parse(event.data));
+    const ws = new WebSocket(url);
+    socketRef.current = ws;
+    
+    ws.onmessage = (event) => {
+      try {
+        const parsed = JSON.parse(event.data);
+        setData(parsed);
+      } catch (err) {
+        console.error("Failed to parse message", err);
+      }
+    };
+    
+    return () => {
+      ws.close();
+    };
   }, [url]);`
            }
          ],
          comments: [
            {
              id: 201,
              lineNumber: 21,
              filePath: 'src/hooks/useWebSocket.ts',
              category: 'Code Smell',
              severity: 'INFO',
              commentText: 'Clean up implementation added correctly. Closing the websocket connection prevents memory leaks and active ports hanging on component unmount.'
            }
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!(id in selectedFileIndex)) {
        setSelectedFileIndex(prev => ({ ...prev, [id]: 0 }));
      }
    }
  };

  const getFilteredReviews = () => {
    return reviews.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.repoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper function to render a code diff line-by-line and inject comments inline
  const renderDiffWithComments = (diffHunk: string, filePath: string, comments: Comment[]) => {
    const fileComments = comments.filter(c => c.filePath === filePath);
    const lines = diffHunk.split('\n');
    let currentLineNum = 0;
    
    // Parse start line from headers like @@ -15,7 +15,11 @@
    const headerMatch = lines[0]?.match(/@@ -\d+,\d+ \+(\d+),\d+ @@/);
    if (headerMatch && headerMatch[1]) {
      currentLineNum = parseInt(headerMatch[1]) - 1;
    }

    const outputRows: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      let isAddition = line.startsWith('+');
      let isDeletion = line.startsWith('-');
      let isHeader = line.startsWith('@@');

      // Adjust line number increments for additions or unmodified lines
      if (!isDeletion && !isHeader) {
        currentLineNum++;
      }

      let lineClass = 'diff-line';
      if (isAddition) lineClass += ' diff-addition';
      if (isDeletion) lineClass += ' diff-deletion';

      outputRows.push(
        <div key={`line-${index}`} className={lineClass}>
          <div className="diff-num">
            {isHeader ? '@@' : isDeletion ? '-' : currentLineNum}
          </div>
          <div className="diff-content">{line}</div>
        </div>
      );

      // If we have a comment targeting this line, render it directly underneath!
      const matchingComment = fileComments.find(c => c.lineNumber === currentLineNum);
      if (matchingComment && !isDeletion && !isHeader) {
        outputRows.push(
          <div key={`comment-${matchingComment.id}`} className="comment-card" style={{
            borderLeftColor: matchingComment.severity === 'CRITICAL' ? 'var(--accent-rose)' : 
                             matchingComment.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-purple)'
          }}>
            <div className="comment-header">
              <span className="comment-author" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CornerDownRight size={14} style={{ color: 'var(--text-muted)' }} />
                AI Assistant Reviewer
              </span>
              <span className="badge" style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                backgroundColor: matchingComment.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' :
                                 matchingComment.severity === 'WARNING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                color: matchingComment.severity === 'CRITICAL' ? 'var(--accent-rose)' :
                       matchingComment.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-purple)'
              }}>
                {matchingComment.category} • {matchingComment.severity}
              </span>
            </div>
            <div className="comment-body">{matchingComment.commentText}</div>
          </div>
        );
      }
    });

    return <div className="diff-viewer">{outputRows}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Filter Header */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', background: 'transparent', padding: '8px 0', fontSize: '1rem' }}
            placeholder="Search review history by repo, pull request title, or developer username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Review Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {getFilteredReviews().map((review) => {
          const isExpanded = expandedId === review.id;
          const selectedFileIdx = selectedFileIndex[review.id] || 0;
          const currentDiff = review.diffs[selectedFileIdx];

          return (
            <div key={review.id} className="card" style={{ padding: 0, overflow: 'visible' }}>
              
              {/* Row Header clickable */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none'
                }}
                onClick={() => toggleExpand(review.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {review.repoName}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      PR #{review.prNumber}
                    </span>
                  </div>
                  <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>{review.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Opened by: <strong>{review.author}</strong></span>
                    <span>•</span>
                    <span>Reviewed: {review.createdAt}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Reviews Posted ({review.comments.length})
                  </span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expander body */}
              {isExpanded && (
                <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                  
                  {/* File selector tabs & content */}
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    
                    {/* Left: Files modified list */}
                    <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '8px', letterSpacing: '0.5px' }}>
                        Modified Files
                      </div>
                      
                      {review.diffs.map((diff, fIdx) => {
                        const isSelected = selectedFileIdx === fIdx;
                        const fileCommentsCount = review.comments.filter(c => c.filePath === diff.filePath).length;

                        return (
                          <div
                            key={fIdx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--border-cyan)' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSelectedFileIndex(prev => ({ ...prev, [review.id]: fIdx }))}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <FileCode size={14} style={{ color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: '0.8rem',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                direction: 'rtl', // show end of path
                                textAlign: 'left'
                              }}>
                                {diff.filePath}
                              </span>
                            </div>
                            
                            {fileCommentsCount > 0 && (
                              <span className="badge badge-rose" style={{
                                padding: '2px 6px',
                                fontSize: '0.65rem',
                                borderRadius: '4px'
                              }}>
                                {fileCommentsCount}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: Code diff renderer */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {currentDiff?.filePath}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MessageSquare size={14} /> Scroll to view inline review suggestions
                        </span>
                      </div>
                      
                      {currentDiff && renderDiffWithComments(currentDiff.diffHunk, currentDiff.filePath, review.comments)}
                    </div>

                  </div>

                </div>
              )}

            </div>
          );
        })}

        {getFilteredReviews().length === 0 && (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 16px', color: 'var(--accent-amber)' }} />
            <p>No historical review records matched your search query.</p>
          </div>
        )}
      </div>

    </div>
  );
};
