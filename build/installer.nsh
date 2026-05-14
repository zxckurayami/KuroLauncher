!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define KURO_VERSION "0.4.0"
!define KURO_BG 0x101014
!define KURO_PANEL 0x17171C
!define KURO_PANEL_SOFT 0x221417
!define KURO_ACCENT 0x2E2EFF
!define KURO_ACCENT_SOFT 0x17103B
!define KURO_TEXT 0xFFFFFF
!define KURO_MUTED 0xA8A8B2

!define MUI_ABORTWARNING
!define MUI_BGCOLOR "0x101014"
!define MUI_TEXTCOLOR "0xFFFFFF"
!define MUI_INSTFILESPAGE_COLORS "FFFFFF 101014"
!define MUI_DIRECTORYPAGE_BGCOLOR "0x101014"
!define MUI_WELCOMEPAGE_TITLE "KuroLauncher ${KURO_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "Кастомный мастер установки KuroLauncher."
!define MUI_FINISHPAGE_TITLE "KuroLauncher готов"
!define MUI_FINISHPAGE_TEXT "Установка завершена. Деинсталлятор будет лежать в папке лаунчера."
!define MUI_FINISHPAGE_RUN_TEXT "Запустить KuroLauncher"

BrandingText "KuroLauncher ${KURO_VERSION}"

!macro customInstallMode
  !ifndef BUILD_UNINSTALLER
    StrCpy $isForceCurrentInstall "1"
  !endif
!macroend

!ifndef BUILD_UNINSTALLER
!include "StrContains.nsh"

Var KuroInstallDirInput
Var KuroDesktopShortcutCheckbox
Var KuroDesktopShortcutState
Var KuroRunAfterCheckbox
Var KuroRunAfterState
Var KuroTitleFont
Var KuroStrongFont

!macro customWelcomePage
  Page custom KuroWelcomePageCreate KuroWelcomePageLeave
!macroend

!macro customInit
  StrCpy $KuroDesktopShortcutState ${BST_CHECKED}
  StrCpy $KuroRunAfterState ${BST_CHECKED}
!macroend

!macro customPageAfterChangeDir
  Page custom KuroInstallOptionsPageCreate KuroInstallOptionsPageLeave
!macroend

!macro customFinishPage
  Page custom KuroFinishPageCreate KuroFinishPageLeave
!macroend

Function KuroPaintPage
  Pop $0
  SetCtlColors $0 ${KURO_TEXT} ${KURO_BG}
FunctionEnd

Function KuroSetWizardNext
  Exch $0
  GetDlgItem $1 $HWNDPARENT 1
  SendMessage $1 ${WM_SETTEXT} 0 "STR:$0"
  Pop $0
FunctionEnd

Function KuroWelcomePageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  Push $0
  Call KuroPaintPage
  Push "Далее"
  Call KuroSetWizardNext

  CreateFont $KuroTitleFont "Segoe UI" 18 700
  CreateFont $KuroStrongFont "Segoe UI" 10 700

  ${NSD_CreateLabel} 0u 0u 300u 140u ""
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_BG}

  ${NSD_CreateLabel} 0u 0u 300u 10u "KUROLAUNCHER ${KURO_VERSION}"
  Pop $1
  SetCtlColors $1 ${KURO_ACCENT} ${KURO_BG}

  ${NSD_CreateLabel} 0u 18u 300u 28u "Установка в стиле лаунчера"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_BG}
  SendMessage $1 ${WM_SETFONT} $KuroTitleFont 0

  ${NSD_CreateLabel} 0u 51u 300u 28u "Мастер подготовит KuroLauncher, создаст запись удаления и положит деинсталлятор прямо в папку приложения."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_BG}

  ${NSD_CreateLabel} 0u 92u 300u 38u ""
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}

  ${NSD_CreateLabel} 12u 100u 276u 10u "0.4.0  •  авторские проекты  •  RU/EN  •  Minecraft-шрифт"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}
  SendMessage $1 ${WM_SETFONT} $KuroStrongFont 0

  ${NSD_CreateLabel} 12u 114u 276u 10u "Новый установщик использует тёмную палитру, красный акцент и компактные панели KuroLauncher."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_PANEL}

  nsDialogs::Show
FunctionEnd

Function KuroWelcomePageLeave
FunctionEnd

Function KuroBrowseInstallDir
  nsDialogs::SelectFolderDialog "Выберите папку для KuroLauncher" "$INSTDIR"
  Pop $0
  ${If} $0 != error
    ${NSD_SetText} $KuroInstallDirInput "$0"
  ${EndIf}
FunctionEnd

Function KuroInstallOptionsPageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  Push $0
  Call KuroPaintPage
  Push "Установить"
  Call KuroSetWizardNext

  CreateFont $KuroTitleFont "Segoe UI" 16 700
  CreateFont $KuroStrongFont "Segoe UI" 10 700

  ${NSD_CreateLabel} 0u 0u 300u 18u "Папка установки"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_BG}
  SendMessage $1 ${WM_SETFONT} $KuroTitleFont 0

  ${NSD_CreateLabel} 0u 24u 300u 18u "Выберите, куда поставить лаунчер. Если выбрать обычную папку, мастер добавит подпапку KuroLauncher."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_BG}

  ${NSD_CreateLabel} 0u 50u 300u 58u ""
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}

  ${NSD_CreateLabel} 10u 57u 280u 10u "Путь к приложению"
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_PANEL}

  ${NSD_CreateDirRequest} 10u 72u 218u 14u "$INSTDIR"
  Pop $KuroInstallDirInput
  SetCtlColors $KuroInstallDirInput ${KURO_TEXT} ${KURO_PANEL_SOFT}

  ${NSD_CreateBrowseButton} 236u 72u 54u 14u "Обзор"
  Pop $1

  ${NSD_OnClick} $1 KuroBrowseInstallDir

  ${NSD_CreateCheckbox} 10u 92u 280u 12u "Создать ярлык KuroLauncher на рабочем столе"
  Pop $KuroDesktopShortcutCheckbox
  SetCtlColors $KuroDesktopShortcutCheckbox ${KURO_TEXT} ${KURO_PANEL}
  ${NSD_SetState} $KuroDesktopShortcutCheckbox $KuroDesktopShortcutState

  ${NSD_CreateLabel} 0u 117u 300u 22u "Меню Пуск и деинсталлятор будут добавлены автоматически. Удаление запускается из папки лаунчера или из настроек Windows."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_BG}

  nsDialogs::Show
FunctionEnd

Function KuroInstallOptionsPageLeave
  ${NSD_GetText} $KuroInstallDirInput $INSTDIR
  ${NSD_GetState} $KuroDesktopShortcutCheckbox $KuroDesktopShortcutState

  ${If} $INSTDIR == ""
    MessageBox MB_ICONEXCLAMATION|MB_OK "Выберите папку установки."
    Abort
  ${EndIf}

  ${StrContains} $0 "${APP_FILENAME}" $INSTDIR
  ${If} $0 == ""
    StrCpy $INSTDIR "$INSTDIR\${APP_FILENAME}"
  ${EndIf}
FunctionEnd

Function KuroFinishPageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  Push $0
  Call KuroPaintPage
  Push "Готово"
  Call KuroSetWizardNext

  CreateFont $KuroTitleFont "Segoe UI" 18 700
  CreateFont $KuroStrongFont "Segoe UI" 10 700

  ${NSD_CreateLabel} 0u 0u 300u 10u "ГОТОВО"
  Pop $1
  SetCtlColors $1 ${KURO_ACCENT} ${KURO_BG}

  ${NSD_CreateLabel} 0u 18u 300u 28u "KuroLauncher установлен"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_BG}
  SendMessage $1 ${WM_SETFONT} $KuroTitleFont 0

  ${NSD_CreateLabel} 0u 52u 300u 28u "Приложение установлено в выбранную папку. Внутри находится деинсталлятор с таким же оформлением."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_BG}

  ${NSD_CreateLabel} 0u 94u 300u 36u ""
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}

  ${NSD_CreateCheckbox} 12u 106u 276u 12u "Запустить KuroLauncher после закрытия мастера"
  Pop $KuroRunAfterCheckbox
  SetCtlColors $KuroRunAfterCheckbox ${KURO_TEXT} ${KURO_PANEL}
  ${NSD_SetState} $KuroRunAfterCheckbox $KuroRunAfterState

  nsDialogs::Show
FunctionEnd

Function KuroFinishPageLeave
  ${NSD_GetState} $KuroRunAfterCheckbox $KuroRunAfterState
  ${If} $KuroRunAfterState == ${BST_CHECKED}
    HideWindow
    ExecShell "open" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  ${EndIf}
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
!else
Var KuroUnTitleFont
Var KuroUnStrongFont

!macro customUnWelcomePage
  UninstPage custom un.KuroUnWelcomePageCreate un.KuroUnWelcomePageLeave
!macroend

Function un.KuroUnSetWizardNext
  Exch $0
  GetDlgItem $1 $HWNDPARENT 1
  SendMessage $1 ${WM_SETTEXT} 0 "STR:$0"
  Pop $0
FunctionEnd

Function un.KuroUnWelcomePageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  SetCtlColors $0 ${KURO_TEXT} ${KURO_BG}
  Push "Удалить"
  Call un.KuroUnSetWizardNext

  CreateFont $KuroUnTitleFont "Segoe UI" 18 700
  CreateFont $KuroUnStrongFont "Segoe UI" 10 700

  ${NSD_CreateLabel} 0u 0u 300u 10u "ДЕИНСТАЛЛЯТОР"
  Pop $1
  SetCtlColors $1 ${KURO_ACCENT} ${KURO_BG}

  ${NSD_CreateLabel} 0u 18u 300u 28u "Удаление KuroLauncher"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_BG}
  SendMessage $1 ${WM_SETFONT} $KuroUnTitleFont 0

  ${NSD_CreateLabel} 0u 52u 300u 28u "Мастер удалит файлы приложения, ярлыки и записи установки. Папка Minecraft и пользовательские данные не трогаются."
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_BG}

  ${NSD_CreateLabel} 0u 94u 300u 36u ""
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}

  ${NSD_CreateLabel} 12u 103u 276u 10u "Папка установки"
  Pop $1
  SetCtlColors $1 ${KURO_MUTED} ${KURO_PANEL}

  ${NSD_CreateLabel} 12u 116u 276u 10u "$INSTDIR"
  Pop $1
  SetCtlColors $1 ${KURO_TEXT} ${KURO_PANEL}
  SendMessage $1 ${WM_SETFONT} $KuroUnStrongFont 0

  nsDialogs::Show
FunctionEnd

Function un.KuroUnWelcomePageLeave
FunctionEnd
!endif
