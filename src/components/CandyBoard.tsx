import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CandyColor, CandyItem, LevelConfig, SpecialType, TileState } from '../types';
import { Candy3D } from './Candy3D';
import { audio } from '../services/audioService';
import { haptic, subscribeToShake } from '../services/hapticService';
import confetti from 'canvas-confetti';
import { Target, Zap, Award, Sparkles, Star, Play, RotateCcw, MapPin, ChevronRight, CheckCircle2, Trophy, Coins } from 'lucide-react';

interface CandyBoardProps {
  level: LevelConfig;
  hapticsEnabled: boolean;
  activeBooster: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped' | null;
  onBoosterUsed: (booster: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped') => void;
  onLevelWin: (score: number, stars: number) => void;
  onLevelFail: (score: number) => void;
  onEmotionChange: (emotion: 'happy' | 'excited' | 'worried' | 'celebrating' | 'surprised') => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onOpenMap?: () => void;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface DragState {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  dx: number;
  dy: number;
}

interface DragRefData {
  r: number;
  c: number;
  startX: number;
  startY: number;
  startTime: number;
  hasMoved: boolean;
  hasSwapped: boolean;
  pointerId?: number;
}

interface AnimatingSwap {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  state: 'swapping' | 'invalid';
}

const CANDY_COLORS: CandyColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const getRandomColor = (): CandyColor => {
  return CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
};

export const CandyBoard: React.FC<CandyBoardProps> = ({
  level,
  hapticsEnabled,
  activeBooster,
  onBoosterUsed,
  onLevelWin,
  onLevelFail,
  onEmotionChange,
  onRestartLevel,
  onNextLevel,
  onOpenMap
}) => {
  const [board, setBoard] = useState<CandyItem[][]>([]);
  const [tiles, setTiles] = useState<TileState[][]>([]);
  const [selectedCandy, setSelectedCandy] = useState<{ row: number; col: number } | null>(null);
  const selectedCandyRef = useRef<{ row: number; col: number } | null>(null);

  const updateSelectedCandy = useCallback((val: { row: number; col: number } | null) => {
    selectedCandyRef.current = val;
    setSelectedCandy(val);
  }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [jellyLeft, setJellyLeft] = useState(0);
  const [collectedColorCount, setCollectedColorCount] = useState(0);
  const [, setCombo] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [gameOverStatus, setGameOverStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const [starsEarned, setStarsEarned] = useState<number>(1);

  // Interactive Drag / Swipe Scroll State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragRefData | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const processingWatchdogRef = useRef<number | null>(null);
  const executeSwapRef = useRef<(r1: number, c1: number, r2: number, c2: number) => Promise<void> | void>(() => {});
  const boardStateRef = useRef<CandyItem[][]>([]);
  const isProcessingRef = useRef(false);
  const isSwappingRef = useRef(false);
  const lastGestureTimeRef = useRef(0);
  const cascadeVersionRef = useRef(0);
  const lastSwapTimestampRef = useRef(0);

  // Smooth Swapping Animation State
  const [animatingSwap, setAnimatingSwap] = useState<AnimatingSwap | null>(null);

  // Idle Hint Pair
  const [hintPair, setHintPair] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  // Subscribe to screen shake events
  useEffect(() => {
    isMounted.current = true;
    const unsub = subscribeToShake(() => {
      setIsShaking(true);
      setTimeout(() => {
        if (isMounted.current) setIsShaking(false);
      }, 350);
    });
    return () => {
      isMounted.current = false;
      dragCleanupRef.current?.();
      unsub();
    };
  }, []);

  // Initialize board & tiles
  useEffect(() => {
    const rows = level.rows;
    const cols = level.cols;

    let totalJelly = 0;
    const newTiles: TileState[][] = [];
    for (let r = 0; r < rows; r++) {
      newTiles[r] = [];
      for (let c = 0; c < cols; c++) {
        const isJelly =
          level.objective.type === 'jelly' &&
          (r >= 1 && r <= rows - 2 && c >= 1 && c <= cols - 2);
        if (isJelly) totalJelly++;
        newTiles[r][c] = {
          hasJelly: isJelly,
          jellyHealth: isJelly ? 1 : 0
        };
      }
    }
    setTiles(newTiles);
    setJellyLeft(totalJelly);

    // Generate candy grid without initial matches of 3
    const newBoard: CandyItem[][] = [];
    for (let r = 0; r < rows; r++) {
      newBoard[r] = [];
      for (let c = 0; c < cols; c++) {
        let color: CandyColor;
        do {
          color = getRandomColor();
        } while (
          (r >= 2 && newBoard[r - 1][c].color === color && newBoard[r - 2][c].color === color) ||
          (c >= 2 && newBoard[r][c - 1].color === color && newBoard[r][c - 2].color === color)
        );

        newBoard[r][c] = {
          id: `candy_${r}_${c}_${Date.now()}_${Math.random()}`,
          row: r,
          col: c,
          color,
          special: 'none'
        };
      }
    }

    boardStateRef.current = newBoard;
    isProcessingRef.current = false;
    isSwappingRef.current = false;
    setBoard(newBoard);
    setIsProcessing(false);
    setScore(0);
    setMovesLeft(level.moves);
    setCollectedColorCount(0);
    setCombo(0);
    setGameOverStatus('playing');
    setAutoNextCountdown(null);
    setStarsEarned(1);
    updateSelectedCandy(null);
    setDragState(null);
    setAnimatingSwap(null);
    setHintPair(null);
    dragRef.current = null;
    onEmotionChange('happy');
  }, [level, onEmotionChange]);

  // Spawn floating text popups (e.g. "+60", "Sweet!", "Divine!")
  const triggerFloatingText = useCallback((x: number, y: number, text: string, color = '#f43f5e') => {
    const id = `float_${Date.now()}_${Math.random()}`;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1200);
  }, []);

  // Check board for matches of 3 or more
  const findMatches = useCallback((currentBoard: CandyItem[][]) => {
    const rows = currentBoard.length;
    const cols = currentBoard[0]?.length || 0;
    const matchGrid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    const matchedCoords: { r: number; c: number }[] = [];

    // Horizontal check
    for (let r = 0; r < rows; r++) {
      let matchLength = 1;
      for (let c = 0; c < cols; c++) {
        const isLast = c === cols - 1;
        const isMatch =
          !isLast &&
          currentBoard[r][c].color === currentBoard[r][c + 1].color &&
          currentBoard[r][c].special !== 'color_bomb' &&
          currentBoard[r][c + 1].special !== 'color_bomb';

        if (isMatch) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let i = 0; i < matchLength; i++) {
              matchGrid[r][c - i] = true;
            }
          }
          matchLength = 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < cols; c++) {
      let matchLength = 1;
      for (let r = 0; r < rows; r++) {
        const isLast = r === rows - 1;
        const isMatch =
          !isLast &&
          currentBoard[r][c].color === currentBoard[r + 1][c].color &&
          currentBoard[r][c].special !== 'color_bomb' &&
          currentBoard[r + 1][c].special !== 'color_bomb';

        if (isMatch) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let i = 0; i < matchLength; i++) {
              matchGrid[r - i][c] = true;
            }
          }
          matchLength = 1;
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matchGrid[r][c]) {
          matchedCoords.push({ r, c });
        }
      }
    }

    return { matchedCoords, matchGrid };
  }, []);

  // Find any possible valid move on the board for idle player hint
  const findPossibleMove = useCallback(
    (currentBoard: CandyItem[][]) => {
      const rows = currentBoard.length;
      const cols = currentBoard[0]?.length || 0;

      // Try horizontal swaps
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const test = currentBoard.map(row => [...row]);
          const temp = test[r][c];
          test[r][c] = test[r][c + 1];
          test[r][c + 1] = temp;
          const { matchedCoords } = findMatches(test);
          if (matchedCoords.length > 0) {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
        }
      }

      // Try vertical swaps
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          const test = currentBoard.map(row => [...row]);
          const temp = test[r][c];
          test[r][c] = test[r + 1][c];
          test[r + 1][c] = temp;
          const { matchedCoords } = findMatches(test);
          if (matchedCoords.length > 0) {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }
      return null;
    },
    [findMatches]
  );

  // Setup / Reset Idle Hint Timer
  const resetHintTimer = useCallback(() => {
    setHintPair(null);
    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    if (isProcessing || gameOverStatus !== 'playing' || board.length === 0) return;

    hintTimeoutRef.current = window.setTimeout(() => {
      if (!isProcessing && gameOverStatus === 'playing') {
        const move = findPossibleMove(board);
        if (move) {
          setHintPair(move);
        }
      }
    }, 4500);
  }, [isProcessing, gameOverStatus, board, findPossibleMove]);

  useEffect(() => {
    resetHintTimer();
    return () => {
      if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
    };
  }, [board, isProcessing, gameOverStatus, resetHintTimer]);

  // Process candy removal, specials, falling gravity & cascades with smooth animations
  const processBoardCascades = useCallback(
    async (
      initialBoard: CandyItem[][],
      currentCombo = 1,
      swappedCandy?: { r: number; c: number; specialToCreate?: SpecialType; specialColor?: CandyColor }
    ) => {
      const myVersion = ++cascadeVersionRef.current;
      isProcessingRef.current = true;
      setIsProcessing(true);

      if (processingWatchdogRef.current) clearTimeout(processingWatchdogRef.current);
      processingWatchdogRef.current = window.setTimeout(() => {
        isProcessingRef.current = false;
        isSwappingRef.current = false;
        setIsProcessing(false);
      }, 500);

      try {
        if (myVersion !== cascadeVersionRef.current) return;
        const currentBoard = initialBoard.map(row => row.map(item => ({ ...item, isDropping: false })));
        const { matchedCoords, matchGrid } = findMatches(currentBoard);

        const hasSpecialToCreate = Boolean(
          swappedCandy &&
          swappedCandy.specialToCreate &&
          swappedCandy.specialToCreate !== 'none'
        );

        if (matchedCoords.length === 0 && !hasSpecialToCreate) {
          isProcessingRef.current = false;
          isSwappingRef.current = false;
          setIsProcessing(false);
          setCombo(0);
          if (processingWatchdogRef.current) {
            clearTimeout(processingWatchdogRef.current);
            processingWatchdogRef.current = null;
          }
          return;
        }

        // Play match sounds & haptics
        setCombo(currentCombo);
        audio.playMatch(currentCombo);
        haptic.match(currentCombo, hapticsEnabled);

        if (currentCombo >= 4) {
          onEmotionChange('surprised');
          triggerFloatingText(180, 200, '✨ DIVINE!! ✨', '#e11d48');
        } else if (currentCombo >= 2) {
          onEmotionChange('excited');
          triggerFloatingText(180, 200, '🍬 TASTY!! 🍬', '#9333ea');
        }

        // Mark matched items and calculate score
        let pointsEarned = matchedCoords.length * 50 * currentCombo;
        let targetColorMatched = 0;
        let jellyClearedCount = 0;

        // Check special candy activations
        const specialsToTrigger: { r: number; c: number; type: SpecialType; color: CandyColor }[] = [];

        matchedCoords.forEach(({ r, c }) => {
          const item = currentBoard[r][c];
          if (item.special !== 'none') {
            specialsToTrigger.push({ r, c, type: item.special, color: item.color });
          }
          if (level.objective.type === 'color_collection' && item.color === level.objective.targetColor) {
            targetColorMatched++;
          }
        });

        // Clear jelly on tiles where matches occurred
        setTiles(prevTiles => {
          const updated = prevTiles.map(row => row.map(tile => ({ ...tile })));
          matchedCoords.forEach(({ r, c }) => {
            if (updated[r] && updated[r][c] && updated[r][c].hasJelly) {
              updated[r][c].hasJelly = false;
              jellyClearedCount++;
              pointsEarned += 200;
            }
          });
          return updated;
        });

        if (jellyClearedCount > 0) {
          setJellyLeft(prev => Math.max(0, prev - jellyClearedCount));
        }

        if (targetColorMatched > 0) {
          setCollectedColorCount(prev => prev + targetColorMatched);
        }

        // Handle special candy explosions
        specialsToTrigger.forEach(spec => {
          if (spec.type === 'striped_h') {
            audio.playSpecialExplode('striped');
            haptic.specialExplode(hapticsEnabled);
            pointsEarned += 300;
            for (let c = 0; c < level.cols; c++) {
              matchGrid[spec.r][c] = true;
            }
          } else if (spec.type === 'striped_v') {
            audio.playSpecialExplode('striped');
            haptic.specialExplode(hapticsEnabled);
            pointsEarned += 300;
            for (let r = 0; r < level.rows; r++) {
              matchGrid[r][spec.c] = true;
            }
          } else if (spec.type === 'wrapped') {
            audio.playSpecialExplode('wrapped');
            haptic.specialExplode(hapticsEnabled);
            pointsEarned += 500;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = spec.r + dr;
                const nc = spec.c + dc;
                if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
                  matchGrid[nr][nc] = true;
                }
              }
            }
          }
        });

        // Spawn special candy ONLY if actually created by a 4-match or 5-match
        if (hasSpecialToCreate && swappedCandy) {
          matchGrid[swappedCandy.r][swappedCandy.c] = false;
          currentBoard[swappedCandy.r][swappedCandy.c].special = swappedCandy.specialToCreate!;
          if (swappedCandy.specialColor) {
            currentBoard[swappedCandy.r][swappedCandy.c].color = swappedCandy.specialColor;
          }
          audio.playSpecialCreate();
        }

        // Visual floating score
        setScore(prev => prev + pointsEarned);

        // STEP 1: Pop animation on matched candies
        const poppingBoard = currentBoard.map((row, r) =>
          row.map((item, c) => ({
            ...item,
            isMatched: matchGrid[r][c] && !(hasSpecialToCreate && swappedCandy && swappedCandy.r === r && swappedCandy.c === c)
          }))
        );
        boardStateRef.current = poppingBoard;
        setBoard(poppingBoard);

        // Allow popping animation to play
        await new Promise(res => setTimeout(res, 75));

        // STEP 2: Calculate gravity drop with drop distances
        const rows = level.rows;
        const cols = level.cols;
        const nextBoard: CandyItem[][] = Array.from({ length: rows }, () => Array(cols));

        for (let c = 0; c < cols; c++) {
          let emptySpaces = 0;
          for (let r = rows - 1; r >= 0; r--) {
            const isSpecialCandyPos = hasSpecialToCreate && swappedCandy && swappedCandy.r === r && swappedCandy.c === c;
            if (matchGrid[r][c] && !isSpecialCandyPos) {
              emptySpaces++;
            } else {
              if (emptySpaces > 0) {
                const newRow = r + emptySpaces;
                nextBoard[newRow][c] = {
                  ...currentBoard[r][c],
                  row: newRow,
                  col: c,
                  isMatched: false,
                  isDropping: true,
                  dropDistance: emptySpaces
                };
              } else {
                nextBoard[r][c] = {
                  ...currentBoard[r][c],
                  isMatched: false,
                  isDropping: false,
                  dropDistance: 0
                };
              }
            }
          }

          // Fill top empty spaces with newly spawned candies with drop distance
          for (let r = 0; r < emptySpaces; r++) {
            nextBoard[r][c] = {
              id: `candy_${r}_${c}_${Date.now()}_${Math.random()}`,
              row: r,
              col: c,
              color: getRandomColor(),
              special: 'none',
              isNew: true,
              isMatched: false,
              isDropping: true,
              dropDistance: emptySpaces + (emptySpaces - r)
            };
          }
        }

        boardStateRef.current = nextBoard;
        setBoard(nextBoard);

        // Wait for smooth drop bounce to settle
        await new Promise(res => setTimeout(res, 110));

        // Clear isDropping flags
        const settledBoard = nextBoard.map(row =>
          row.map(item => ({ ...item, isDropping: false, dropDistance: 0 }))
        );
        boardStateRef.current = settledBoard;
        setBoard(settledBoard);

        // Cascading check after drop
        await new Promise(res => setTimeout(res, 10));
        processBoardCascades(settledBoard, currentCombo + 1);
      } catch (err) {
        console.error('Cascading execution error:', err);
        isProcessingRef.current = false;
        isSwappingRef.current = false;
        setIsProcessing(false);
      }
    },
    [findMatches, level, hapticsEnabled, onEmotionChange, triggerFloatingText]
  );

  // Execute cascade directly from a custom matchGrid (for Color Bomb, Striped+Striped, etc.)
  const executeMatchGridCascade = async (
    currentBoard: CandyItem[][],
    matchGrid: boolean[][],
    currentCombo = 1,
    pointsEarned = 0
  ) => {
    isProcessingRef.current = true;
    setIsProcessing(true);

    if (processingWatchdogRef.current) clearTimeout(processingWatchdogRef.current);
    processingWatchdogRef.current = window.setTimeout(() => {
      isProcessingRef.current = false;
      isSwappingRef.current = false;
      setIsProcessing(false);
    }, 500);

    try {
      setScore(prev => prev + pointsEarned);

      // Clear jelly on tiles where matches occurred
      let jellyClearedCount = 0;
      setTiles(prevTiles => {
        const updated = prevTiles.map(row => row.map(tile => ({ ...tile })));
        for (let r = 0; r < level.rows; r++) {
          for (let c = 0; c < level.cols; c++) {
            if (matchGrid[r]?.[c] && updated[r]?.[c]?.hasJelly) {
              updated[r][c].hasJelly = false;
              jellyClearedCount++;
            }
          }
        }
        return updated;
      });

      if (jellyClearedCount > 0) {
        setJellyLeft(prev => Math.max(0, prev - jellyClearedCount));
      }

      // Check color objective collection
      let targetColorMatched = 0;
      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          if (
            matchGrid[r]?.[c] &&
            level.objective.type === 'color_collection' &&
            currentBoard[r]?.[c]?.color === level.objective.targetColor
          ) {
            targetColorMatched++;
          }
        }
      }
      if (targetColorMatched > 0) {
        setCollectedColorCount(prev => prev + targetColorMatched);
      }

      // STEP 1: Pop animation
      const poppingBoard = currentBoard.map((row, r) =>
        row.map((item, c) => ({
          ...item,
          isMatched: matchGrid[r][c]
        }))
      );
      boardStateRef.current = poppingBoard;
      setBoard(poppingBoard);

      await new Promise(res => setTimeout(res, 75));

      // STEP 2: Gravity drop
      const rows = level.rows;
      const cols = level.cols;
      const nextBoard: CandyItem[][] = Array.from({ length: rows }, () => Array(cols));

      for (let c = 0; c < cols; c++) {
        let emptySpaces = 0;
        for (let r = rows - 1; r >= 0; r--) {
          if (matchGrid[r][c]) {
            emptySpaces++;
          } else {
            if (emptySpaces > 0) {
              const newRow = r + emptySpaces;
              nextBoard[newRow][c] = {
                ...currentBoard[r][c],
                row: newRow,
                col: c,
                isMatched: false,
                isDropping: true,
                dropDistance: emptySpaces
              };
            } else {
              nextBoard[r][c] = {
                ...currentBoard[r][c],
                isMatched: false,
                isDropping: false,
                dropDistance: 0
              };
            }
          }
        }

        // Fill top empty spaces with newly spawned candies
        for (let r = 0; r < emptySpaces; r++) {
          nextBoard[r][c] = {
            id: `candy_${r}_${c}_${Date.now()}_${Math.random()}`,
            row: r,
            col: c,
            color: getRandomColor(),
            special: 'none',
            isNew: true,
            isMatched: false,
            isDropping: true,
            dropDistance: emptySpaces + (emptySpaces - r)
          };
        }
      }

      boardStateRef.current = nextBoard;
      setBoard(nextBoard);

      await new Promise(res => setTimeout(res, 110));

      const settledBoard = nextBoard.map(row =>
        row.map(item => ({ ...item, isDropping: false, dropDistance: 0 }))
      );
      boardStateRef.current = settledBoard;
      setBoard(settledBoard);

      await new Promise(res => setTimeout(res, 10));
      processBoardCascades(settledBoard, currentCombo + 1);
    } catch (err) {
      console.error('Match grid cascade error:', err);
      isProcessingRef.current = false;
      isSwappingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Check Level Win / Fail conditions
  useEffect(() => {
    if (gameOverStatus !== 'playing') return;

    let isObjectiveMet = false;
    if (level.objective.type === 'score') {
      isObjectiveMet = score >= level.objective.targetScore;
    } else if (level.objective.type === 'jelly') {
      isObjectiveMet = jellyLeft === 0;
    } else if (level.objective.type === 'color_collection') {
      isObjectiveMet = collectedColorCount >= (level.objective.targetColorCount || 20);
    }

    if (isObjectiveMet) {
      setGameOverStatus('won');
      onEmotionChange('celebrating');
      audio.playWinFanfare();
      haptic.levelWin(hapticsEnabled);
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 }
      });

      let stars = 1;
      if (score >= level.star3) stars = 3;
      else if (score >= level.star2) stars = 2;
      setStarsEarned(stars);

      onLevelWin(score, stars);
      setAutoNextCountdown(3); // 3-second celebration countdown before automatically opening next level!
      return;
    }

    if (movesLeft <= 0 && !isProcessing) {
      setGameOverStatus('lost');
      onEmotionChange('worried');
      haptic.lightTap(hapticsEnabled);
      onLevelFail(score);
    }
  }, [score, jellyLeft, collectedColorCount, movesLeft, isProcessing, level, gameOverStatus, onLevelWin, onLevelFail, onEmotionChange, hapticsEnabled]);

  // Auto-advance to next level when countdown completes
  useEffect(() => {
    if (gameOverStatus !== 'won' || autoNextCountdown === null) return;

    if (autoNextCountdown <= 0) {
      setAutoNextCountdown(null);
      onNextLevel();
      return;
    }

    const timer = window.setTimeout(() => {
      setAutoNextCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [gameOverStatus, autoNextCountdown, onNextLevel]);

  const handleNextLevelClick = () => {
    setAutoNextCountdown(null);
    audio.playSwap();
    haptic.lightTap(hapticsEnabled);
    onNextLevel();
  };

  const handleRestartClick = () => {
    setAutoNextCountdown(null);
    audio.playSwap();
    haptic.lightTap(hapticsEnabled);
    onRestartLevel();
  };

  const handleOpenMapClick = () => {
    setAutoNextCountdown(null);
    audio.playSelect();
    if (onOpenMap) onOpenMap();
  };

  // Booster action handler
  const handleBoosterApplication = (r: number, c: number) => {
    if (!activeBooster) return;
    audio.playBooster();
    haptic.specialExplode(hapticsEnabled);

    if (activeBooster === 'lollipop') {
      const updated = board.map(row => row.map(item => ({ ...item })));
      updated[r][c].isMatched = true;
      setScore(s => s + 250);
      triggerFloatingText(180, 180, '🍭 LOLLIPOP CRUSH! 🍭', '#ec4899');
      setBoard(updated);
      onBoosterUsed('lollipop');
      setTimeout(() => processBoardCascades(updated), 200);
    } else if (activeBooster === 'colorBomb') {
      const updated = board.map(row => row.map(item => ({ ...item })));
      updated[r][c].special = 'color_bomb';
      triggerFloatingText(180, 180, '🌟 COLOR BOMB READY! 🌟', '#eab308');
      setBoard(updated);
      onBoosterUsed('colorBomb');
    } else if (activeBooster === 'striped') {
      const updated = board.map(row => row.map(item => ({ ...item })));
      updated[r][c].special = Math.random() > 0.5 ? 'striped_h' : 'striped_v';
      triggerFloatingText(180, 180, '⚡ STRIPED CANDY READY! ⚡', '#06b6d4');
      setBoard(updated);
      onBoosterUsed('striped');
    }
  };

  // CORE SWAP EXECUTION (used by both Swipe/Drag gesture & Click/Tap)
  const executeSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (gameOverStatus !== 'playing') return;

    const now = Date.now();
    if (now - lastSwapTimestampRef.current < 50) {
      return;
    }
    lastSwapTimestampRef.current = now;

    // Immediately cancel any previous swap animation
    setAnimatingSwap(null);
    isSwappingRef.current = false;

    // If board is currently cascading/dropping, immediately settle the in-flight board
    // so user's swipe happens INSTANTLY without freezing or waiting!
    if (isProcessingRef.current || boardStateRef.current.length > 0) {
      const settled = (boardStateRef.current.length > 0 ? boardStateRef.current : board).map(row =>
        row.map(item => ({ ...item, isMatched: false, isDropping: false, dropDistance: 0 }))
      );
      boardStateRef.current = settled;
      setBoard(settled);
      isProcessingRef.current = false;
      setIsProcessing(false);
      if (processingWatchdogRef.current) {
        clearTimeout(processingWatchdogRef.current);
        processingWatchdogRef.current = null;
      }
    }

    // Deduct 1 move on every move
    setMovesLeft(m => Math.max(0, m - 1));

    // Cancel any stale background cascade loops by incrementing cascade version
    cascadeVersionRef.current++;

    const isAdjacent =
      (Math.abs(r1 - r2) === 1 && c1 === c2) ||
      (Math.abs(c1 - c2) === 1 && r1 === r2);

    if (!isAdjacent) return;

    const currentBoard = boardStateRef.current.length > 0 ? boardStateRef.current : board;
    const candy1 = currentBoard[r1]?.[c1];
    const candy2 = currentBoard[r2]?.[c2];
    if (!candy1 || !candy2) return;

    const isStriped = (s: SpecialType) => s === 'striped_h' || s === 'striped_v';
    const hasColorBomb = candy1.special === 'color_bomb' || candy2.special === 'color_bomb';
    const hasStriped = isStriped(candy1.special) || isStriped(candy2.special);
    const hasWrapped = candy1.special === 'wrapped' || candy2.special === 'wrapped';

    // Special Combo 1: Color Bomb + Color Bomb (Massive rainbow board wipe)
    if (candy1.special === 'color_bomb' && candy2.special === 'color_bomb') {
      isProcessingRef.current = true;
      setIsProcessing(true);
      audio.playSpecialExplode('color_bomb');
      haptic.colorBomb(hapticsEnabled);
      triggerFloatingText(180, 180, '🌈 SUPER COLOR BOMB WIPE! 🌈', '#f43f5e');

      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(true));
      executeMatchGridCascade(currentBoard, matchGrid, 1, 5000);
      return;
    }

    // Special Combo 2: Color Bomb + Striped Candy (Transform & cross detonators)
    if (hasColorBomb && hasStriped) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      audio.playSpecialExplode('color_bomb');
      haptic.colorBomb(hapticsEnabled);
      triggerFloatingText(180, 180, '⚡ COLOR STRIPE FEVER! ⚡', '#8b5cf6');

      const targetCol = candy1.special === 'color_bomb' ? candy2.color : candy1.color;
      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(false));
      matchGrid[r1][c1] = true;
      matchGrid[r2][c2] = true;

      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          if (currentBoard[r][c].color === targetCol) {
            matchGrid[r][c] = true;
            if ((r + c) % 2 === 0) {
              for (let col = 0; col < level.cols; col++) matchGrid[r][col] = true;
            } else {
              for (let row = 0; row < level.rows; row++) matchGrid[row][c] = true;
            }
          }
        }
      }

      executeMatchGridCascade(currentBoard, matchGrid, 1, 3500);
      return;
    }

    // Special Combo 3: Color Bomb + Any Regular Candy
    if (hasColorBomb) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      const targetCol = candy1.special === 'color_bomb' ? candy2.color : candy1.color;
      audio.playSpecialExplode('color_bomb');
      haptic.colorBomb(hapticsEnabled);
      triggerFloatingText(180, 180, `⚡ COLOR CRUSH: ${targetCol.toUpperCase()}! ⚡`, '#8b5cf6');

      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(false));
      matchGrid[r1][c1] = true;
      matchGrid[r2][c2] = true;

      let count = 0;
      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          if (currentBoard[r][c].color === targetCol) {
            matchGrid[r][c] = true;
            count++;
          }
        }
      }

      executeMatchGridCascade(currentBoard, matchGrid, 1, count * 150 + 500);
      return;
    }

    // Special Combo 4: Striped + Striped (4-direction cross blast)
    if (isStriped(candy1.special) && isStriped(candy2.special)) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      audio.playSpecialExplode('striped');
      haptic.specialExplode(hapticsEnabled);
      triggerFloatingText(180, 180, '⚡ CROSS BLAST COMBO! ⚡', '#06b6d4');

      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(false));
      for (let c = 0; c < level.cols; c++) {
        matchGrid[r1][c] = true;
        matchGrid[r2][c] = true;
      }
      for (let r = 0; r < level.rows; r++) {
        matchGrid[r][c1] = true;
        matchGrid[r][c2] = true;
      }

      executeMatchGridCascade(currentBoard, matchGrid, 1, 2000);
      return;
    }

    // Special Combo 5: Striped + Wrapped (Mega 3-row & 3-column blast)
    if (hasStriped && hasWrapped) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      audio.playSpecialExplode('wrapped');
      haptic.specialExplode(hapticsEnabled);
      triggerFloatingText(180, 180, '💥 MEGA BLAST COMBO! 💥', '#ec4899');

      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(false));
      for (let dr = -1; dr <= 1; dr++) {
        const row = r2 + dr;
        if (row >= 0 && row < level.rows) {
          for (let c = 0; c < level.cols; c++) matchGrid[row][c] = true;
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        const col = c2 + dc;
        if (col >= 0 && col < level.cols) {
          for (let r = 0; r < level.rows; r++) matchGrid[r][col] = true;
        }
      }

      executeMatchGridCascade(currentBoard, matchGrid, 1, 3000);
      return;
    }

    // Special Combo 6: Wrapped + Wrapped (5x5 giant blast)
    if (candy1.special === 'wrapped' && candy2.special === 'wrapped') {
      isProcessingRef.current = true;
      setIsProcessing(true);
      audio.playSpecialExplode('wrapped');
      haptic.specialExplode(hapticsEnabled);
      triggerFloatingText(180, 180, '💣 GIGA BOMB EXPLOSION! 💣', '#f97316');

      const matchGrid: boolean[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(false));
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r2 + dr;
          const nc = c2 + dc;
          if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
            matchGrid[nr][nc] = true;
          }
        }
      }

      executeMatchGridCascade(currentBoard, matchGrid, 1, 3500);
      return;
    }

    // Tentatively check match before committing
    const swappedBoard = currentBoard.map(row => row.map(item => ({ ...item })));
    swappedBoard[r1][c1] = { ...candy2, row: r1, col: c1 };
    swappedBoard[r2][c2] = { ...candy1, row: r2, col: c2 };

    const { matchedCoords } = findMatches(swappedBoard);

    // Swap slide transition into place
    isSwappingRef.current = true;
    setAnimatingSwap({ r1, c1, r2, c2, state: 'swapping' });
    audio.playSwap();
    haptic.swap(hapticsEnabled);

    try {
      // Snappy 60ms slide transition
      await new Promise(res => setTimeout(res, 60));
    } finally {
      setAnimatingSwap(null);
      isSwappingRef.current = false;
    }

    boardStateRef.current = swappedBoard;
    setBoard(swappedBoard);

    if (matchedCoords.length === 0) {
      // Candies stay swapped in their new position
      return;
    }

    // Determine special candy creation
    let specialToCreate: SpecialType = 'none';
    const isHorizontalSwap = r1 === r2;

    if (matchedCoords.length >= 5) {
      specialToCreate = 'color_bomb';
      triggerFloatingText(180, 150, '🌟 COLOR BOMB CREATED! 🌟', '#eab308');
    } else if (matchedCoords.length === 4) {
      specialToCreate = isHorizontalSwap ? 'striped_v' : 'striped_h';
      triggerFloatingText(180, 150, '⚡ STRIPED CANDY! ⚡', '#06b6d4');
    }

    processBoardCascades(swappedBoard, 1, {
      r: r2,
      c: c2,
      specialToCreate,
      specialColor: specialToCreate !== 'none' ? candy1.color : undefined
    });
  };

  executeSwapRef.current = executeSwap;

  // Cleanup any active drag/swipe window listeners
  const cleanupDragListeners = useCallback(() => {
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
      dragCleanupRef.current = null;
    }
  }, []);

  // Process dragging move logic with effortless, feather-light sensitivity
  const processDragMove = (clientX: number, clientY: number) => {
    if (!dragRef.current || gameOverStatus !== 'playing') return;
    if (dragRef.current.hasSwapped) return;

    const { r, c, startX, startY, startTime } = dragRef.current;
    const rawDx = clientX - startX;
    const rawDy = clientY - startY;
    const absDx = Math.abs(rawDx);
    const absDy = Math.abs(rawDy);
    const dist = Math.hypot(rawDx, rawDy);

    if (dist < 2) return;
    dragRef.current.hasMoved = true;
    if (dist >= 8 && selectedCandyRef.current) {
      updateSelectedCandy(null);
    }

    // STRICT ADJACENT NEIGHBOR ONLY:
    // Determine target neighbor with smart direction resolution
    let targetR = r;
    let targetC = c;
    const isHorizontal = absDx >= absDy;

    if (isHorizontal) {
      targetC = rawDx > 0 ? c + 1 : c - 1;
      targetR = r;
      // If horizontal neighbor is off-grid, check vertical neighbor
      if ((targetC < 0 || targetC >= level.cols) && absDy >= 4) {
        targetC = c;
        targetR = rawDy > 0 ? r + 1 : r - 1;
      }
    } else {
      targetR = rawDy > 0 ? r + 1 : r - 1;
      targetC = c;
      // If vertical neighbor is off-grid, check horizontal neighbor
      if ((targetR < 0 || targetR >= level.rows) && absDx >= 4) {
        targetR = r;
        targetC = rawDx > 0 ? c + 1 : c - 1;
      }
    }

    const isValidNeighbor =
      targetR >= 0 &&
      targetR < level.rows &&
      targetC >= 0 &&
      targetC < level.cols &&
      ((Math.abs(targetR - r) === 1 && targetC === c) || (Math.abs(targetC - c) === 1 && targetR === r));

    // INSTANT EFFORTLESS SWAP TRIGGER:
    // Any directional swipe of 5px or fast flick of 4px triggers swap immediately!
    const elapsed = Date.now() - startTime;
    const isFastFlick = elapsed < 350 && dist >= 4;
    const isThresholdMet = (isHorizontal && absDx >= 5) || (!isHorizontal && absDy >= 5) || dist >= 5;

    if (isValidNeighbor && (isThresholdMet || isFastFlick)) {
      // Mark as swapped immediately so this gesture completes cleanly with only the adjacent neighbor!
      dragRef.current.hasSwapped = true;
      cleanupDragListeners();
      setDragState(null);
      updateSelectedCandy(null);

      executeSwapRef.current(r, c, targetR, targetC);
      return;
    }

    // Subtle tactile glide capped at 20px
    const maxDrag = 20;
    const dx = isHorizontal ? (isValidNeighbor ? Math.max(-maxDrag, Math.min(maxDrag, rawDx)) : rawDx * 0.1) : 0;
    const dy = !isHorizontal ? (isValidNeighbor ? Math.max(-maxDrag, Math.min(maxDrag, rawDy)) : rawDy * 0.1) : 0;

    setDragState({
      fromR: r,
      fromC: c,
      toR: isValidNeighbor ? targetR : r,
      toC: isValidNeighbor ? targetC : c,
      dx,
      dy
    });
  };

  // Process dragging end logic
  const processDragEnd = (clientX?: number, clientY?: number) => {
    const activeDrag = dragRef.current;
    dragRef.current = null;
    setDragState(null);
    cleanupDragListeners();

    if (!activeDrag) return;
    const { r, c, hasSwapped, startX, startY } = activeDrag;

    // If swap was already triggered during the drag gesture, finish smoothly
    if (hasSwapped) return;

    let targetR = -1;
    let targetC = -1;

    if (clientX !== undefined && clientY !== undefined) {
      const dx = clientX - startX;
      const dy = clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const dist = Math.hypot(dx, dy);

      if (dist >= 5) {
        if (absDx >= absDy) {
          targetR = r;
          targetC = dx > 0 ? c + 1 : c - 1;
        } else {
          targetR = dy > 0 ? r + 1 : r - 1;
          targetC = c;
        }
      }
    }

    if (
      targetR >= 0 &&
      targetR < level.rows &&
      targetC >= 0 &&
      targetC < level.cols &&
      ((Math.abs(targetR - r) === 1 && targetC === c) || (Math.abs(targetC - c) === 1 && targetR === r))
    ) {
      executeSwapRef.current(r, c, targetR, targetC);
      return;
    }

    // Small displacement or static tap: trigger tap/click move handler reliably
    handleCandyClick(r, c);
  };

  // Universal gesture starter for mouse and touch
  const startDragGesture = (
    startX: number,
    startY: number,
    r: number,
    c: number,
    pointerId?: number
  ) => {
    if (gameOverStatus !== 'playing') return;

    // If booster is active, apply immediately
    if (activeBooster) {
      handleBoosterApplication(r, c);
      return;
    }

    const now = Date.now();
    // Prevent duplicate triggers within 75ms for the same candy
    if (
      dragRef.current &&
      dragRef.current.r === r &&
      dragRef.current.c === c &&
      now - dragRef.current.startTime < 75
    ) {
      return;
    }

    resetHintTimer();
    cleanupDragListeners();
    isSwappingRef.current = false; // Release any stale swap lock on user gesture

    dragRef.current = {
      r,
      c,
      startX,
      startY,
      startTime: now,
      hasMoved: false,
      hasSwapped: false,
      pointerId
    };

    const onWindowMove = (ev: PointerEvent) => {
      if (dragRef.current && (pointerId === undefined || ev.pointerId === pointerId)) {
        processDragMove(ev.clientX, ev.clientY);
      }
    };

    const onWindowUp = (ev: PointerEvent) => {
      if (pointerId === undefined || ev.pointerId === pointerId) {
        processDragEnd(ev.clientX, ev.clientY);
      }
    };

    const onWindowCancel = (ev: PointerEvent) => {
      if (pointerId === undefined || ev.pointerId === pointerId) {
        dragRef.current = null;
        setDragState(null);
        cleanupDragListeners();
      }
    };

    window.addEventListener('pointermove', onWindowMove, { passive: true });
    window.addEventListener('pointerup', onWindowUp, { passive: true });
    window.addEventListener('pointercancel', onWindowCancel, { passive: true });

    dragCleanupRef.current = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowCancel);
      dragCleanupRef.current = null;
    };
  };

  // Prevent background page bounce/scroll when interacting with the candy board on mobile
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const preventTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    boardEl.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      boardEl.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  // Universal Pointer Down Handler for Touch, Mouse, and Pen
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, r: number, c: number) => {
    if (gameOverStatus !== 'playing') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if pointer capture is not supported
    }
    startDragGesture(e.clientX, e.clientY, r, c, e.pointerId);
  };

  // Check if swapping (r, c) with neighbor (nr, nc) creates a match
  const checkNeighborMatch = useCallback((r: number, c: number, nr: number, nc: number) => {
    if (nr < 0 || nr >= level.rows || nc < 0 || nc >= level.cols) return false;
    const currentBoard = boardStateRef.current.length > 0 ? boardStateRef.current : board;
    const candy1 = currentBoard[r]?.[c];
    const candy2 = currentBoard[nr]?.[nc];
    if (!candy1 || !candy2) return false;

    // Special candy combos always match/explode
    if (candy1.special !== 'none' || candy2.special !== 'none') return true;

    // Test swap
    const testBoard = currentBoard.map(row => row.map(item => ({ ...item })));
    testBoard[r][c] = { ...candy2, row: r, col: c };
    testBoard[nr][nc] = { ...candy1, row: nr, col: nc };

    const { matchedCoords } = findMatches(testBoard);
    return matchedCoords.length > 0;
  }, [level.rows, level.cols, board]);

  // Find neighbor with which (r, c) can form an instant match
  const findMatchingNeighbor = useCallback((r: number, c: number) => {
    const neighbors = [
      { nr: r, nc: c + 1 }, // right
      { nr: r, nc: c - 1 }, // left
      { nr: r + 1, nc: c }, // down
      { nr: r - 1, nc: c }, // up
    ];
    for (const { nr, nc } of neighbors) {
      if (checkNeighborMatch(r, c, nr, nc)) {
        return { nr, nc };
      }
    }
    return null;
  }, [checkNeighborMatch]);

  const lastClickTimeRef = useRef<{ r: number; c: number; time: number }>({ r: -1, c: -1, time: 0 });

  // Tap / Click Selection Handler (Fallback & Accessibility)
  const handleCandyClick = (r: number, c: number) => {
    if (gameOverStatus !== 'playing') return;

    // Debounce rapid duplicate invocations from mixed touch/pointer/click event streams
    const now = Date.now();
    if (
      lastClickTimeRef.current.r === r &&
      lastClickTimeRef.current.c === c &&
      now - lastClickTimeRef.current.time < 200
    ) {
      return;
    }
    lastClickTimeRef.current = { r, c, time: now };

    // Settle board immediately if it's currently cascading, so clicks execute without delay
    if (isProcessingRef.current) {
      if (boardStateRef.current.length > 0) {
        const settled = boardStateRef.current.map(row =>
          row.map(item => ({ ...item, isMatched: false, isDropping: false, dropDistance: 0 }))
        );
        boardStateRef.current = settled;
        setBoard(settled);
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
      if (processingWatchdogRef.current) {
        clearTimeout(processingWatchdogRef.current);
        processingWatchdogRef.current = null;
      }
    }

    if (activeBooster) {
      handleBoosterApplication(r, c);
      return;
    }

    const prev = selectedCandyRef.current;

    // 1. If another candy was already selected:
    if (prev) {
      const prevR = prev.row;
      const prevC = prev.col;

      // Check if clicked candy is adjacent to previous selection:
      const isAdjacent =
        (Math.abs(prevR - r) === 1 && prevC === c) ||
        (Math.abs(prevC - c) === 1 && prevR === r);

      if (isAdjacent) {
        // SWAP & MOVE IMMEDIATELY ON ADJACENT CLICK!
        updateSelectedCandy(null);
        executeSwap(prevR, prevC, r, c);
        return;
      }

      // Clicked the SAME candy twice:
      if (prevR === r && prevC === c) {
        const matchNeighbor = findMatchingNeighbor(r, c);
        if (matchNeighbor) {
          updateSelectedCandy(null);
          executeSwap(r, c, matchNeighbor.nr, matchNeighbor.nc);
          return;
        }
        // Fallback swap with available neighbor so double-clicking ALWAYS MOVES!
        const fallbackC = c + 1 < level.cols ? c + 1 : c - 1 >= 0 ? c - 1 : c;
        if (fallbackC !== c) {
          updateSelectedCandy(null);
          executeSwap(r, c, r, fallbackC);
        }
        return;
      }

      // If clicked candy is not adjacent to previous selection:
      // Does this candy have an immediate match with any neighbor?
      const matchNeighbor = findMatchingNeighbor(r, c);
      if (matchNeighbor) {
        updateSelectedCandy(null);
        executeSwap(r, c, matchNeighbor.nr, matchNeighbor.nc);
        return;
      }

      // Otherwise switch selection to (r, c)
      haptic.lightTap(hapticsEnabled);
      audio.playSelect();
      updateSelectedCandy({ row: r, col: c });
      return;
    }

    // 2. First click on (r, c) with no previous selection:
    // Check if this candy can make an instant match with any neighbor!
    const matchNeighbor = findMatchingNeighbor(r, c);
    if (matchNeighbor) {
      // 1 CLICK = INSTANT MOVE & MATCH!
      updateSelectedCandy(null);
      executeSwap(r, c, matchNeighbor.nr, matchNeighbor.nc);
      return;
    }

    // If no instant match, select it so next adjacent click swaps it!
    haptic.lightTap(hapticsEnabled);
    audio.playSelect();
    updateSelectedCandy({ row: r, col: c });
  };

  return (
    <div
      ref={boardRef}
      className={`relative flex flex-col items-center select-none candy-board-container ${
        isShaking ? 'screen-shake' : ''
      }`}
    >
      {/* Floating text announcements */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
        {floatingTexts.map(f => (
          <div
            key={f.id}
            className="absolute font-black text-xl sm:text-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-bounce text-white px-3 py-1 rounded-full border-2 border-white/80"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              backgroundColor: f.color,
            }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Main 3D Candy Board Canvas */}
      <div
        className="relative p-2.5 sm:p-4 rounded-3xl bg-amber-950/75 backdrop-blur-md border-4 border-amber-300/70 shadow-[0_18px_40px_rgba(0,0,0,0.65)] touch-none"
        style={{
          perspective: '1000px',
        }}
      >
        {/* Subtle 3D tilted grid frame */}
        <div
          className="grid gap-1 sm:gap-1.5 p-1 rounded-2xl bg-amber-900/60 border border-amber-500/30"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((candy, c) => {
              const hasJelly = tiles[r] && tiles[r][c] && tiles[r][c].hasJelly;
              const isSelected = selectedCandy?.row === r && selectedCandy?.col === c;
              const isAdjacentToSelected = Boolean(
                selectedCandy &&
                ((Math.abs(selectedCandy.row - r) === 1 && selectedCandy.col === c) ||
                  (Math.abs(selectedCandy.col - c) === 1 && selectedCandy.row === r))
              );

              // Check if currently hint candidate
              const isHint =
                hintPair !== null &&
                ((hintPair.r1 === r && hintPair.c1 === c) ||
                  (hintPair.r2 === r && hintPair.c2 === c));

              // Compute real-time drag offsets for tactile scroll
              let isDragging = false;
              let dragOffset: { x: number; y: number } | undefined;

              if (dragState) {
                if (dragState.fromR === r && dragState.fromC === c) {
                  isDragging = true;
                  dragOffset = { x: dragState.dx, y: dragState.dy };
                } else if (dragState.toR === r && dragState.toC === c) {
                  // Neighbor candy sliding in opposite direction
                  dragOffset = { x: -dragState.dx, y: -dragState.dy };
                }
              }

              // Compute responsive swap slide vector
              let swapVector: { dc: number; dr: number; isInvalid?: boolean } | undefined;
              if (animatingSwap) {
                if (animatingSwap.r1 === r && animatingSwap.c1 === c) {
                  swapVector = {
                    dc: animatingSwap.c2 - animatingSwap.c1,
                    dr: animatingSwap.r2 - animatingSwap.r1,
                    isInvalid: animatingSwap.state === 'invalid'
                  };
                } else if (animatingSwap.r2 === r && animatingSwap.c2 === c) {
                  swapVector = {
                    dc: animatingSwap.c1 - animatingSwap.c2,
                    dr: animatingSwap.r1 - animatingSwap.r2,
                    isInvalid: animatingSwap.state === 'invalid'
                  };
                }
              }

              return (
                <div
                  key={`${r}_${c}`}
                  data-candy-pos={`${r},${c}`}
                  onPointerDown={e => handlePointerDown(e, r, c)}
                  onClick={() => handleCandyClick(r, c)}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-xl flex items-center justify-center transition-all duration-150 touch-none select-none cursor-pointer candy-tile ${
                    (r + c) % 2 === 0 ? 'bg-amber-950/40' : 'bg-amber-900/30'
                  } ${
                    isSelected ? 'ring-2 ring-yellow-400 bg-amber-800/60 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-20' : ''
                  } ${activeBooster ? 'ring-2 ring-pink-400/60 hover:ring-pink-300 cursor-crosshair' : ''}`}
                >
                  {/* Frosted Jelly Layer */}
                  {hasJelly && (
                    <div className="absolute inset-0.5 rounded-lg bg-pink-400/50 border border-pink-300/80 backdrop-blur-[1px] shadow-inner pointer-events-none z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                    </div>
                  )}

                  {/* Directional Guide Arrow when neighboring candy is selected */}
                  {isAdjacentToSelected && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-400 bg-emerald-500/30 z-20 pointer-events-none flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.7)]">
                      <span className="text-white text-xs sm:text-sm font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
                        {r === selectedCandy!.row && c > selectedCandy!.col && '➡️'}
                        {r === selectedCandy!.row && c < selectedCandy!.col && '⬅️'}
                        {r > selectedCandy!.row && c === selectedCandy!.col && '⬇️'}
                        {r < selectedCandy!.row && c === selectedCandy!.col && '⬆️'}
                      </span>
                    </div>
                  )}

                  {/* 3D Candy Piece with interactive drag & animations */}
                  <Candy3D
                    color={candy.color}
                    special={candy.special}
                    isSelected={isSelected}
                    isHint={isHint}
                    isMatched={candy.isMatched}
                    isDropping={candy.isDropping}
                    dropDistance={candy.dropDistance}
                    isDragging={isDragging}
                    dragOffset={dragOffset}
                    swapVector={swapVector}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Target & In-Game Objective Progress Bar */}
      <div className="w-full max-w-md mt-3 px-2 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white bg-black/45 backdrop-blur-md py-2 px-4 rounded-2xl border border-white/20">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Target className="w-4 h-4" />
          <span>
            {level.objective.type === 'score' && `Target: ${level.objective.targetScore.toLocaleString()}`}
            {level.objective.type === 'jelly' && `Jelly Left: ${jellyLeft}`}
            {level.objective.type === 'color_collection' && `Collect: ${collectedColorCount}/${level.objective.targetColorCount}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-pink-300">
            <Zap className="w-3.5 h-3.5" />
            <span>Moves: {movesLeft}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Award className="w-3.5 h-3.5" />
            <span>{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LEVEL WON / TARGET COMPLETE POPUP MODAL                      */}
      {/* ============================================================ */}
      {gameOverStatus === 'won' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-neutral-900/95 via-amber-950/80 to-neutral-900/95 border-3 border-yellow-400/80 p-6 sm:p-7 flex flex-col items-center gap-4 text-center shadow-[0_0_50px_rgba(234,179,8,0.4)] backdrop-blur-xl">
            {/* Top Glowing Trophy / Badge */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.8)] border-2 border-white rotate-3 animate-bounce">
                <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-amber-950 fill-amber-950" />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow whitespace-nowrap border border-white/40">
                ✨ TARGET COMPLETE! ✨
              </span>
            </div>

            {/* Title */}
            <div className="mt-2">
              <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
                LEVEL {level.levelNumber} WON!
              </h3>
              <p className="text-xs sm:text-sm font-bold text-amber-200 mt-0.5">
                Sweet Victory! Target achieved with {movesLeft} moves to spare!
              </p>
            </div>

            {/* Animated 3 Stars */}
            <div className="flex items-center justify-center gap-3 my-1">
              {[1, 2, 3].map(st => (
                <div
                  key={st}
                  className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 transform ${
                    st <= starsEarned
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.8)] scale-110 rotate-3 border-2 border-white'
                      : 'bg-white/10 opacity-30 scale-90 border border-white/20'
                  }`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-9 sm:h-9 ${
                      st <= starsEarned
                        ? 'fill-amber-900 text-amber-900 drop-shadow-sm animate-pulse'
                        : 'text-white/30'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Score & Reward Summary Pill */}
            <div className="w-full bg-black/40 rounded-2xl p-3 border border-white/15 flex items-center justify-around text-xs sm:text-sm font-bold">
              <div className="flex flex-col items-center">
                <span className="text-neutral-400 text-[10px] uppercase font-black">Score</span>
                <span className="text-yellow-300 text-base sm:text-lg font-black">{score.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col items-center">
                <span className="text-neutral-400 text-[10px] uppercase font-black">Bonus</span>
                <div className="flex items-center gap-1 text-amber-300 text-base sm:text-lg font-black">
                  <Coins className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>+200</span>
                </div>
              </div>
            </div>

            {/* Next Level Open Badge */}
            <div className="py-1.5 px-3.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs sm:text-sm font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Level {level.levelNumber + 1} is now OPEN! 🔓</span>
            </div>

            {/* BIG NEXT LEVEL ACTION BUTTON */}
            <button
              onClick={handleNextLevelClick}
              className="group w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-lg sm:text-xl shadow-[0_10px_28px_rgba(16,185,129,0.5)] border-3 border-emerald-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
              <span>NEXT LEVEL ▶</span>
              {autoNextCountdown !== null && autoNextCountdown > 0 && (
                <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full text-emerald-100 font-mono">
                  ({autoNextCountdown}s)
                </span>
              )}
            </button>

            {/* Secondary Buttons: Replay & Level Map */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-0.5">
              <button
                onClick={handleRestartClick}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>Replay ↻</span>
              </button>
              <button
                onClick={handleOpenMapClick}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MapPin className="w-4 h-4 text-cyan-300" />
                <span>Level Map 🗺️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LEVEL FAILED / OUT OF MOVES POPUP MODAL                      */}
      {/* ============================================================ */}
      {gameOverStatus === 'lost' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-neutral-900/95 via-rose-950/80 to-neutral-900/95 border-2 border-rose-500/60 p-6 sm:p-7 flex flex-col items-center gap-4 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/25 border-2 border-rose-400 flex items-center justify-center text-3xl shadow-inner">
              💔
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow leading-tight">
                OUT OF MOVES!
              </h3>
              <p className="text-xs sm:text-sm font-bold text-rose-200 mt-1">
                Level {level.levelNumber} target wasn't reached. Don't give up, Senpai!
              </p>
            </div>

            {/* Target Status */}
            <div className="w-full py-3 px-4 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-neutral-300">Score: {score.toLocaleString()}</span>
              <span className="text-amber-300">
                {level.objective.type === 'score' && `Target: ${level.objective.targetScore.toLocaleString()}`}
                {level.objective.type === 'jelly' && `${jellyLeft} Jelly Left`}
                {level.objective.type === 'color_collection' && `${collectedColorCount}/${level.objective.targetColorCount} Candies`}
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRestartClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-base sm:text-lg shadow-[0_6px_20px_rgba(244,63,94,0.5)] border-2 border-yellow-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
              <span>TRY AGAIN ↻</span>
            </button>

            <button
              onClick={handleOpenMapClick}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-neutral-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MapPin className="w-4 h-4 text-cyan-300" />
              <span>Back to Map 🗺️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
