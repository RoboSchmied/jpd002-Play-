import './App.css';
import { ChangeEvent, useEffect, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useAppDispatch, useAppSelector, loadArchive, loadPsf, play, pause } from "./Actions";
import { PsfPlayerModule } from './PsfPlayerModule';

function RenderRow(props: ListChildComponentProps) {
  const { index, style } = props;

  const state = useAppSelector((state) => state.player);
  let archiveFile = state.archiveFileList[index];

  const dispatch = useAppDispatch();  
  const handleClick = function(archiveFileIndex : number) {
    dispatch(loadPsf(archiveFileIndex));
  }

  let itemStyle : React.CSSProperties = {};
  if(index === state.playingIndex) {
    itemStyle.fontWeight = "bold";
  }

  return (
    <ListItem style={style} key={index} component="div" disablePadding>
      <ListItemButton onClick={(e) => handleClick(index)}>
        <ListItemText primary={archiveFile} primaryTypographyProps={{style: itemStyle}} />
      </ListItemButton>
    </ListItem>
  );
}

function usePrevious<Type>(value : Type) : Type | undefined {
  const ref = useRef<Type>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function App() {
    const dispatch = useAppDispatch();
    const listRef = useRef<FixedSizeList>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const state = useAppSelector((state) => state.player);
    const prevArchiveFileListVersion = usePrevious(state.archiveFileListVersion);
    const prevPlaying = usePrevious(state.playing);
    useEffect(() => {
      if(state.archiveFileListVersion !== prevArchiveFileListVersion) {
        listRef.current?.scrollTo(0);
      }
      if(state.playing !== prevPlaying) {
        if(state.playing) {
          audioRef.current?.play().then(() => {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: 'PsfPlayer',
              artist: 'PsfPlayer',
              album: 'PsfPlayer',
            });
            navigator.mediaSession.setPositionState({
              duration: 1000,
              playbackRate: 44100,
              position: 0
            });
            navigator.mediaSession.playbackState = 'playing';
          });
        } else {
          audioRef.current?.pause();
          navigator.mediaSession.playbackState = 'paused';
        }
        navigator.mediaSession.setActionHandler('play', function() {
            navigator.mediaSession.playbackState = 'playing';
            dispatch(play())
        });
        navigator.mediaSession.setActionHandler('pause', function() {
            navigator.mediaSession.playbackState = 'paused';
            dispatch(pause())
        });
      }
    });
    const handleChange = function(event : ChangeEvent<HTMLInputElement>) {
      if(event.target && event.target.files && event.target.files.length !== 0) {
        var url = URL.createObjectURL(event.target.files[0]);
        dispatch(loadArchive(url));
      }
    }
    if(PsfPlayerModule === null) {
      return (
        <div className="App">
          <span>Loading...</span>
        </div>
      )
    } else {
      let prevIndex = Math.max(state.playingIndex - 1, 0);
      let nextIndex = Math.min(state.playingIndex + 1, state.archiveFileList.length);
      return (
        <div className="App">
          <audio loop ref={audioRef} src={`${process.env.PUBLIC_URL}/silence.wav`} />
          <FixedSizeList
            className={"playlist"}
            height={480}
            width={360}
            itemSize={46}
            itemCount={state.archiveFileList.length}
            overscanCount={5}
            ref={listRef}
            >
              {RenderRow}
          </FixedSizeList>
          <div>
            <br />
            <div>{state.currentPsfTags ? `${state.currentPsfTags.game} - ${state.currentPsfTags.title}` : 'PsfPlayer'}</div>
            <br />
            <button disabled={!state.psfLoaded} onClick={() => dispatch(loadPsf(prevIndex))}>&#x23EE;</button>
            {
              state.playing ?
                (<button disabled={!state.psfLoaded} onClick={() => dispatch(pause())}>&#x23F8;</button>)
                :
                (<button disabled={!state.psfLoaded} onClick={() => dispatch(play())}>&#x25B6;</button>)
            }
            <button disabled={!state.psfLoaded} onClick={() => dispatch(loadPsf(nextIndex))}>&#x23ED;</button>
          </div>
          <div>
            <input type="file" onChange={handleChange}/>
          </div>
          <span className="version">
            {`Version: ${process.env.REACT_APP_VERSION}`}
          </span>
        </div>
      );
    }
};
