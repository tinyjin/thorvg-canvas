{
  "variables": {
    "thorvg_dir": "<(module_root_dir)/deps/thorvg/<(OS)-<(target_arch)"
  },
  "targets": [
    {
      "target_name": "thorvg",
      "sources": [
        "native/addon.cc",
        "native/handle.cc",
        "native/canvas.cc",
        "native/bindings.cc"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")",
        "<(thorvg_dir)/include"
      ],
      "defines": [
        "NAPI_VERSION=8",
        "TVG_STATIC",
        "NODE_ADDON_API_DISABLE_DEPRECATED",
        "NODE_ADDON_API_ENABLE_TYPE_CHECK_ON_AS"
      ],
      "libraries": ["<(thorvg_dir)/libthorvg.a"],
      "cflags_cc": ["-std=c++17", "-fexceptions", "-O3"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "MACOSX_DEPLOYMENT_TARGET": "11.0",
        "OTHER_CPLUSPLUSFLAGS": ["-O3"]
      },
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1, "AdditionalOptions": ["/std:c++17"] }
      },
      "conditions": [
        ["OS=='linux'", {
          "libraries": ["-lpthread"],
          "ldflags": ["-static-libstdc++", "-static-libgcc", "-s"]
        }]
      ]
    }
  ]
}
