import { useContext } from "preact/hooks";
import { UserInputsContext } from "../user-inputs";
import { ImmutableSetter } from "../preact-help";
import { EditorLevel } from "./extended-level-format";
import { Immutable } from "engine/utils/immutable";
import { createContext } from "preact";

export type TrackMoveInLevel = (transform: (dx: number, dy: number, levelBefore: Immutable<EditorLevel>) => Immutable<EditorLevel>) => void
export type LevelFollower = {
  readonly trackMoveInLevel: TrackMoveInLevel
}

type UseLevelFollowerProps = {
  setLevel: ImmutableSetter<EditorLevel>
}

function useLevelFollower({
  setLevel,
}: UseLevelFollowerProps): TrackMoveInLevel {
  const userInputs = useContext(UserInputsContext)
  if (userInputs === null) {
    return () => {}
  }

  return (transform) => {
    userInputs.setFollowers((followersBefore) => [{
      shift: (dx, dy) => {
        setLevel((levelBefore) => {
          return transform(dx, dy, levelBefore)
        })
      }
    }])
  }
}

export const LevelFollowerContext = createContext<LevelFollower | null>(null)

type LevelFollowerContextProviderProps = UseLevelFollowerProps & {
  children: any
}

export function LevelFollowerContextProvider({
  children,
  ...remainingProps
}: LevelFollowerContextProviderProps) {
  const levelFollower = useLevelFollower(remainingProps)
  return <LevelFollowerContext.Provider value={{
    trackMoveInLevel: levelFollower,
  }}>{children}</LevelFollowerContext.Provider>
}
