package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// Thin wrapper around the real 7za.exe. electron-builder's bundled
// app-builder.exe shells out to this exact path to extract vendor tool
// archives (e.g. winCodeSign-2.6.0.7z). That archive bundles a macOS
// "darwin" folder containing two symlinked .dylib files; creating a
// symlink on Windows requires SeCreateSymbolicLinkPrivilege, which a
// non-elevated token doesn't have unless Developer Mode is on. Since a
// Windows-only build never needs the darwin folder, this wrapper simply
// excludes it from extraction so the underlying tool never attempts the
// symlink and exits cleanly.
func main() {
	exeDir, err := os.Executable()
	if err != nil {
		fmt.Fprintln(os.Stderr, "7za wrapper: cannot resolve own path:", err)
		os.Exit(1)
	}
	realPath := filepath.Join(filepath.Dir(exeDir), "7za-real.exe")

	args := os.Args[1:]
	if len(args) > 0 && args[0] == "x" {
		args = append(args, "-xr!darwin")
	}

	cmd := exec.Command(realPath, args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			os.Exit(exitErr.ExitCode())
		}
		fmt.Fprintln(os.Stderr, "7za wrapper: failed to run real 7za:", err)
		os.Exit(1)
	}
}
