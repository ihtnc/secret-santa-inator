'use client';

import { PageHeader } from '@/app/components/PageHeader';
import { BackToHome } from '@/app/components/BackToHome';

export default function AboutPage() {
  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="About Secret Santa-inator"
          emoji="📖"
        />

        <div className="bg-card rounded-lg shadow-md p-8">

          <div className="space-y-6 text-secondary">
            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">What is Secret Santa-inator?</h2>
              <p className="leading-relaxed">
                Secret Santa-inator is a simple, privacy-focused web application that helps you organize
                Secret Santa gift exchanges with your friends, family, or coworkers. No registration required,
                no personal data stored - just pure holiday fun!
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">How it Works</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="leading-relaxed"><strong>Create a Group:</strong> Start by creating a new Secret Santa group with a name and description.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="leading-relaxed"><strong>Invite Participants:</strong> Share the group link with friends and family so they can join.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="leading-relaxed"><strong>Add Wish Lists:</strong> Everyone can add their wish list items to help their Secret Santa choose the perfect gift.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="leading-relaxed"><strong>Draw Names:</strong> When everyone has joined, the group admin can randomly assign Secret Santa pairs.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <p className="leading-relaxed"><strong>Exchange Gifts:</strong> Each participant can see who they&apos;re buying for and their wish list - the fun begins!</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">Privacy & Security</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>No account registration required</li>
                <li>Data is stored locally in your browser</li>
                <li>Groups are identified by unique, private links</li>
                <li>Only group members can see group details</li>
                <li>No personal information is collected or stored</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-primary">For Everyone:</h3>
                  <ul className="space-y-1 text-sm list-disc list-inside ml-4">
                    <li>Join multiple Secret Santa groups</li>
                    <li>Create and manage wish lists</li>
                    <li>View your Secret Santa assignment</li>
                    <li>Easy group joining via shared links</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-primary">For Group Admins:</h3>
                  <ul className="space-y-1 text-sm list-disc list-inside ml-4">
                    <li>Create and manage groups</li>
                    <li>View all group members</li>
                    <li>Randomly assign Secret Santa pairs</li>
                    <li>Share group links easily</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">Technical Details</h2>
              <p className="leading-relaxed">
                Built with Next.js, React, and Tailwind CSS. Data is managed through Supabase for reliable
                group coordination while maintaining privacy. The app works entirely in your browser with
                no server-side user tracking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">From the author</h2>
              <p className="leading-relaxed mb-2">
                This project came about due to a random request from my sister to hunt for a tool that could help her organize Secret Santa groups.
              </p>
              <details className="group">
                <summary className="cursor-pointer text-accent hover:text-accent-dark font-medium mb-2">
                  Read more
                </summary>
                <div className="mt-4 space-y-4 border-l-2 border-accent/20 pl-4">
                  <p className="leading-relaxed mb-2">
                    I then took this as an opportunity to conduct an experiment: How far can I take an AI tool (GitHub Copilot) to write code for me without me intervening and writing it myself.
                    As it turns out, very far!
                  </p>
                  <p className="leading-relaxed mb-2">
                    You see, this application is written virtually by AI &mdash; everything from front-end logic to backend triggers.
                    I haven&apos;t written a line of code in this project apart from this small section here on the About page and a couple of Supabase client code I copied from a previous project.
                    That emdash is intentional for the lulz.
                  </p>
                  <p className="leading-relaxed mb-2">
                    Most of the time I spent is on writing prompts, reviewing the changes, accepting some changes, and refining the rest with further prompts.
                  </p>
                  <p className="leading-relaxed mb-2">
                    However, it initially hallucinated the &quot;Add Wish Lists&quot; feature.
                    Though it did give me an idea for a feature, which, over time, I eventually added along with several other features.
                    I decided to keep the wish list &quot;feature&quot; here to demonstrate that the AI came up with this on its own.
                  </p>
                  <p className="leading-relaxed mb-2">
                    Am I satisfied with the end result? On the backend side, absolutely! That part took the most scrutiny from me.
                    As for the frontend, I&apos;ll admit I still feel uneasy about the fact that I just blindly accepted the suggested code based on how it looked on the browser.
                    I tried to steer it to refactor some code at times and guide it to a better implementation but mostly I just accepted what it gave me.
                  </p>
                  <p>
                    However, I don&apos;t think I&apos;ll be able to compete with how fast it is able to generate advanced components like collapsible cards, message history popups, network visualisation in SVG, etc.
                  </p>
                  <p className="leading-relaxed mb-2">
                    Anyway, this whole project/experiment has been fun and I am very happy that I have something to show for, considering that it only took about a day for the first cut that I&apos;m happy with to reach Production.
                  </p>
                </div>
              </details>
            </section>
          </div>
        </div>

        <BackToHome />
      </div>
    </div>
  );
}