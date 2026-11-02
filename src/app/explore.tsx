import { Redirect } from 'expo-router';
// Preserve old starter links without exposing an unrelated example screen.
export default function ExploreRedirect() { return <Redirect href="/" />; }
