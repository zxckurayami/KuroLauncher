!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define MUI_ABORTWARNING
!define MUI_BGCOLOR "0x101014"
!define MUI_TEXTCOLOR "0xFFFFFF"
!define MUI_INSTFILESPAGE_COLORS "FFFFFF 101014"
!define MUI_WELCOMEPAGE_TITLE "KuroLauncher 0.3.0"
!define MUI_WELCOMEPAGE_TEXT "Мастер установки подготовит KuroLauncher на этом компьютере.$\r$\n$\r$\nВы сможете выбрать папку установки и решить, нужен ли ярлык на рабочем столе."
!define MUI_DIRECTORYPAGE_TEXT_TOP "Выберите папку, куда будет установлен KuroLauncher."
!define MUI_FINISHPAGE_TITLE "KuroLauncher установлен"
!define MUI_FINISHPAGE_TEXT "Установка завершена. Можно сразу запустить лаунчер."
!define MUI_FINISHPAGE_RUN_TEXT "Запустить KuroLauncher"

BrandingText "KuroLauncher 0.3.0"

!ifndef BUILD_UNINSTALLER
Var KuroDesktopShortcutCheckbox
Var KuroDesktopShortcutState

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customInit
  StrCpy $KuroDesktopShortcutState ${BST_CHECKED}
!macroend

!macro customPageAfterChangeDir
  Page custom KuroShortcutPageCreate KuroShortcutPageLeave
!macroend

Function KuroShortcutPageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0u 0u 100% 34u "KuroLauncher будет установлен с иконкой приложения и ярлыком в меню Пуск. Дополнительно можно создать быстрый доступ на рабочем столе."
  Pop $0

  ${NSD_CreateCheckbox} 0u 48u 100% 14u "Создать ярлык KuroLauncher на рабочем столе"
  Pop $KuroDesktopShortcutCheckbox
  ${NSD_SetState} $KuroDesktopShortcutCheckbox $KuroDesktopShortcutState

  nsDialogs::Show
FunctionEnd

Function KuroShortcutPageLeave
  ${NSD_GetState} $KuroDesktopShortcutCheckbox $KuroDesktopShortcutState
FunctionEnd

!macro customInstall
  ${If} $KuroDesktopShortcutState == ${BST_CHECKED}
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  ${Else}
    Delete "$newDesktopLink"
  ${EndIf}
!macroend
!endif
