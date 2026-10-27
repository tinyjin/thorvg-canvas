#!/bin/bash
# Builds a static, software-only libthorvg for the host (or the given target triple)
# into deps/thorvg/<platform>-<arch>/, where binding.gyp picks it up.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THORVG="$ROOT/thorvg"

PLATFORM="${1:-$(node -p 'process.platform')}"
ARCH="${2:-$(node -p 'process.arch')}"
# binding.gyp resolves the library by gyp's OS names, which differ from Node's.
case "$PLATFORM" in
  darwin) PLATFORM=mac ;;
  win32) PLATFORM=win ;;
esac
OUT="$ROOT/deps/thorvg/$PLATFORM-$ARCH"

# Must match MACOSX_DEPLOYMENT_TARGET in binding.gyp.
[ "$PLATFORM" = mac ] && export MACOSX_DEPLOYMENT_TARGET=11.0

if [ ! -f "$THORVG/meson.build" ]; then
  echo "thorvg submodule is missing. Run: git submodule update --init" >&2
  exit 1
fi

# cpu engine only: Node is headless, so the GPU backends add size without a use.
# openmp is left out of `extra` on purpose: it would drag libomp into every install.
MESON_OPTIONS=(
  --buildtype=release
  -Db_ndebug=true
  -Ddefault_library=static
  -Dstatic=true
  -Dengines=cpu
  -Dloaders=svg,png,jpg,lottie,ttf,otf,webp
  -Dsavers=gif
  -Dextra=lottie_exp
  -Dthreads=true
  -Dsimd=true
  -Dbindings=capi
  -Dpartial=true
  -Dfile=true
  -Dlog=false
  -Dtools=
  -Dtests=false
  -Db_staticpic=true
)

if [ "$PLATFORM" = win ]; then
  # Match node-gyp's static CRT (/MT).
  MESON_OPTIONS+=(-Db_vscrt=mt)
  # Git Bash's link shadows MSVC link.exe.
  PATH="$(dirname "$(command -v cl)"):$PATH"
fi

rm -rf "$OUT"
mkdir -p "$OUT"
meson setup "$OUT/build" "$THORVG" "${MESON_OPTIONS[@]}"
ninja -C "$OUT/build"

cp "$OUT/build/src/libthorvg-1.a" "$OUT/libthorvg.a"
mkdir -p "$OUT/include"
cp "$THORVG/src/bindings/capi/thorvg_capi.h" "$OUT/include/"
git -C "$THORVG" describe --tags --always > "$OUT/thorvg.version"
echo "libthorvg $(cat "$OUT/thorvg.version") -> $OUT"
