module.exports = function() {
	return `# Customise this file, documentation can be found here:
# https://github.com/fastlane/fastlane/tree/master/fastlane/docs
# All available actions: https://docs.fastlane.tools/actions
# can also be listed using the \`fastlane actions\` command

# Change the syntax highlighting to Ruby
# All lines starting with a # are ignored when running \`fastlane\`

# If you want to automatically update fastlane if a new version is available:
# update_fastlane

# This is the minimum version number required.
# Update this, if you use features of a newer version
fastlane_version "2.28.9"

default_platform :ios

# Read changelog text from file ignoring comment lines
# Return string as content of file
def readFileButIgnoreComment(filepath)
  a = ["#"]
  file_content = ""
  File.open(filepath).each_line do |line|
      line.chomp!
      next if line.empty? || a.any? { |a| line =~ /#{a}/ }
      
      file_content = file_content + line + "\n"
  end

  return file_content
end

platform :ios do

  # TODO: Create and edit your 'changelog' file (at the same level of Fastlane) to include it as changelog message in
  #       submission as beta on Testflight
  changelog = readFileButIgnoreComment("changelog")

  before_all do
    ENV["FASTLANE_ITUNES_TRANSPORTER_USE_SHELL_SCRIPT"] = "1"

    # TODO: Specify your webhook URL of slack to notify its build result
    ENV["SLACK_URL"] = "https://hooks.slack.com/services/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"
    
    # TODO: Specify which version of Xcode used to build this project
    ENV["DEVELOPER_DIR"] = '/Volumes/Main/Applications/Xcode8.3/Xcode.app/Contents/Developer'

    print changelog
  end

  desc "Runs all the tests"
  lane :test do
    scan
  end

  desc "Submit a new Beta Build to Apple TestFlight"
  desc "This will also make sure the profile is up to date"
  lane :beta do
    increment_build_number

    # match(type: "appstore") # more information: https://codesigning.guide

    # TODO: Specify your scheme name here for beta
    gym(scheme: "YourSchemeName")

    pilot(
      changelog: changelog,

      # TODO: Add your beta app feedback email here
      beta_app_feedback_email: 'support@yourdomain.com'
    )

    # commit code to git
    commit_version_bump(
        message: 'Build Version Bump by Fastlane',

        # TODO: Uncomment and specify your .xcodeproj file to build in case you have multiple of .xcodeproj files inside your project directory
        # xcodeproj: './yourproject.xcodeproj'
    )

    # get build number then tag it on git
    build_number = Actions.lane_context[SharedValues::BUILD_NUMBER]
    add_git_tag(tag: "testflight-#{build_number}")
    # push to remote
    push_to_git_remote

    # sh "your_script.sh"
    # You can also use other beta testing services here (run \`fastlane actions\`)
  end

  desc "Deploy a new version to the App Store"
  lane :release do
    increment_build_number
    
    # match(type: "appstore")
    # snapshot

    # TODO: Specify your scheme name here for release
    gym(scheme: "YourSchemeName")
    deliver(force: true)
    # frameit
    
    # commit code to git
    commit_version_bump(
        message: 'Version bump by fastlane',

        # TODO: Uncomment and specify your .xcodeproj file to build in case you have multiple of .xcodeproj files inside your project directory
        # xcodeproj: './yourproject.xcodeproj'
    )

    # get build number then tag it on git
    build_number = Actions.lane_context[SharedValues::BUILD_NUMBER]
    add_git_tag(tag: "appstore-#{build_number}")
    # push to remote
    push_to_git_remote
  end

  # You can define as many lanes as you want

  after_all do |lane|
    # This block is called, only if the executed lane was successful

    slack(
       message: "Successfully deployed new App Update."
    )

    clean_build_artifacts
  end

  error do |lane, exception|
    slack(
      message: exception.message,
      success: false
    )
  end
end


# More information about multiple platforms in fastlane: https://github.com/fastlane/fastlane/blob/master/fastlane/docs/Platforms.md
# All available actions: https://docs.fastlane.tools/actions

# fastlane reports which actions are used
# No personal data is recorded. Learn more at https://github.com/fastlane/enhancer
`;
}();